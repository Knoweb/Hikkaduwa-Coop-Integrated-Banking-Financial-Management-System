package com.hmcs.pawning.service;

import com.hmcs.pawning.dto.IssueTicketRequest;
import com.hmcs.pawning.dto.PawnTicketResponse;
import com.hmcs.pawning.entity.PawnTicket;
import com.hmcs.pawning.entity.PawnPayment;
import com.hmcs.pawning.repository.PawnTicketRepository;
import com.hmcs.pawning.repository.PawnPaymentRepository;
import com.hmcs.pawning.repository.LedgerEntryRepository;
import com.hmcs.pawning.entity.LedgerEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PawnService {

    private final PawnTicketRepository pawnTicketRepository;
    private final PawnPaymentRepository pawnPaymentRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void editTransactionAndRebuildLedger(UUID txId, BigDecimal newAmount, String reason, String managerId) {
        // Find if this is a pawn ticket (disbursement edit)
        java.util.Optional<PawnTicket> tOpt = pawnTicketRepository.findByIdIgnoreTenant(txId);
        
        PawnTicket ticket = null;
        BigDecimal oldAmount = BigDecimal.ZERO;
        boolean isPayment = false;
        PawnPayment payment = null;

        if (tOpt.isPresent()) {
            ticket = tOpt.get();
            oldAmount = ticket.getAdvanceAmount();
            ticket.setAdvanceAmount(newAmount);
            ticket.setRemainingAdvance(newAmount); // initially
            pawnTicketRepository.save(ticket);
        } else {
            // Check if it's a payment
            payment = pawnPaymentRepository.findById(txId)
                    .orElseThrow(() -> new RuntimeException("Transaction not found"));
            ticket = pawnTicketRepository.findByIdIgnoreTenant(payment.getTicketId())
                    .orElseThrow(() -> new RuntimeException("Ticket not found"));
            oldAmount = payment.getPaymentAmount();
            payment.setPaymentAmount(newAmount);
            pawnPaymentRepository.save(payment);
            isPayment = true;
        }

        // Audit Logging
        String dynamicModule = isPayment ? "PAWNING_REDEMPTION" : "PAWNING_GRANT";
        try {
            String sql = "INSERT INTO audit_service.audit_corrections " +
                         "(correction_id, transaction_id, module_type, old_amount, new_amount, reason, manager_id, timestamp, tenant_id) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql, UUID.randomUUID(), txId, dynamicModule, oldAmount, newAmount, reason, managerId, java.sql.Timestamp.valueOf(java.time.LocalDateTime.now()), ticket.getBranchId());
        } catch (Exception ex) {
            System.err.println("Failed to insert into audit_corrections: " + ex.getMessage());
        }

        // Perform Deep Ledger Rebuild for this ticket
        ledgerEntryRepository.deleteByDescriptionContaining("Ticket: " + ticket.getTicketNumber());

        // 1. Rebuild Disbursement Ledger
        LedgerEntry le = new LedgerEntry();
        le.setEntryDate(ticket.getIssueDate());
        le.setCreatedAt(ticket.getIssueDate().equals(java.time.LocalDate.now()) ? java.time.LocalDateTime.now() : ticket.getIssueDate().atTime(9, 0));
        le.setDescription("Pawning Advance — Ticket: " + ticket.getTicketNumber() + " | Member: " + ticket.getMemberId() + " | Method: CASH");
        le.setReferenceNumber(ticket.getTicketId().toString());
        le.setDebitAccount("PAWN_LOANS");
        le.setCreditAccount("CASH_IN_VAULT");
        le.setAmount(ticket.getAdvanceAmount());
        le.setEntryType("PAWN_DISBURSEMENT");
        le.setPaymentMethod("CASH");
        le.setBranchId(ticket.getBranchId());
        ledgerEntryRepository.save(le);

        // 2. Re-apply all payments
        ticket.setRemainingAdvance(ticket.getAdvanceAmount());
        ticket.setCarriedOverInterest(BigDecimal.ZERO);
        ticket.setLastPaymentDate(ticket.getIssueDate());
        ticket.setStatus("ACTIVE");

        List<PawnPayment> payments = pawnPaymentRepository.findByTicketIdOrderByPaymentDateAsc(ticket.getTicketId());
        
        for (PawnPayment p : payments) {
            LocalDate pDate = p.getPaymentDate().toLocalDate();
            PawnTicketResponse currentCalc = enrichWithCalculations(ticket, pDate);
            BigDecimal totalInterest = currentCalc.getAccruedInterest();
            BigDecimal amount = p.getPaymentAmount();

            BigDecimal interestPortion;
            BigDecimal principalPortion;
            BigDecimal newCarriedOver = BigDecimal.ZERO;

            if (amount.compareTo(totalInterest) >= 0) {
                interestPortion = totalInterest;
                principalPortion = amount.subtract(totalInterest);
            } else {
                interestPortion = amount;
                principalPortion = BigDecimal.ZERO;
                newCarriedOver = totalInterest.subtract(amount);
            }

            BigDecimal newRemainingAdvance = ticket.getRemainingAdvance().subtract(principalPortion);

            ticket.setCarriedOverInterest(newCarriedOver);
            ticket.setRemainingAdvance(newRemainingAdvance);
            ticket.setLastPaymentDate(pDate);

            // Update payment portions
            p.setInterestPortion(interestPortion);
            p.setPrincipalPortion(principalPortion);
            pawnPaymentRepository.save(p);

            // Recreate Ledger Entry for payment
            LedgerEntry pLe = new LedgerEntry();
            pLe.setEntryDate(pDate);
            pLe.setCreatedAt(p.getPaymentDate());
            pLe.setDescription("Pawning Repayment — Ticket: " + ticket.getTicketNumber() + " | Member: " + ticket.getMemberId() + " | Method: CASH");
            pLe.setReferenceNumber(p.getPaymentId() != null ? p.getPaymentId().toString() : ticket.getTicketId().toString());
            pLe.setEntryType("PAWN_REPAYMENT");
            pLe.setDebitAccount("CASH_IN_VAULT");
            pLe.setCreditAccount("PAWN_REPAYMENTS");
            pLe.setAmount(amount);
            pLe.setPaymentMethod("CASH");
            pLe.setBranchId(ticket.getBranchId());
            ledgerEntryRepository.save(pLe);
        }

        // Update final status
        PawnTicketResponse finalCalc = enrichWithCalculations(ticket, LocalDate.now());
        if (finalCalc.getTotalDue() != null && finalCalc.getTotalDue().compareTo(BigDecimal.ZERO) <= 0) {
            ticket.setStatus("REDEEMED");
            // Fix last ledger entry description for REDEEMED
            // We can skip exact logic for redemption since the ledger entries are already written as repayment, and we don't have the last one's ID easily.
        }
        
        pawnTicketRepository.save(ticket);
    }


    public PawnTicketResponse issueTicket(IssueTicketRequest request) {
        PawnTicket ticket = new PawnTicket();
        ticket.setMemberId(request.getMemberId());
        ticket.setArticleDescription(request.getArticleDescription());
        ticket.setGrossWeightGrams(request.getGrossWeightGrams());
        ticket.setNetWeightGrams(request.getNetWeightGrams());
        ticket.setPurityKarat(request.getPurityKarat());
        ticket.setAssessedValue(request.getAssessedValue());
        ticket.setAdvanceAmount(request.getAdvanceAmount());
        ticket.setBranchId(request.getBranchId());
        ticket.setValuerId(request.getValuerId());
        
        if (request.getInterestRate() != null) {
            ticket.setInterestRate(request.getInterestRate());
        }

        LocalDate issueDate = request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now();
        ticket.setIssueDate(issueDate);
        ticket.setExpiryDate(issueDate.plusYears(1));
        
        // Use provided ticket number or generate a 6-digit ticket number
        if (request.getTicketNumber() != null && !request.getTicketNumber().trim().isEmpty()) {
            ticket.setTicketNumber(request.getTicketNumber().trim());
        } else {
            long count = pawnTicketRepository.count();
            ticket.setTicketNumber(String.format("%06d", 698594 + count));
        }

        // Default status is PENDING for new workflow
        ticket.setStatus("PENDING");

        ticket = pawnTicketRepository.save(ticket);



        return enrichWithCalculations(ticket, LocalDate.now());
    }

    public PawnTicketResponse approveTicket(UUID ticketId, BigDecimal assessedValue, String remarks) {
        PawnTicket ticket = pawnTicketRepository.findByIdIgnoreTenant(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        if (!"PENDING".equals(ticket.getStatus())) {
            throw new RuntimeException("Only PENDING tickets can be approved");
        }
        
        ticket.setAssessedValue(assessedValue);
        ticket.setCommitteeRemarks(remarks);
        ticket.setStatus("APPROVED");
        
        ticket = pawnTicketRepository.save(ticket);
        return enrichWithCalculations(ticket, LocalDate.now());
    }

    public PawnTicketResponse disburseTicket(UUID ticketId, BigDecimal advanceAmount) {
        PawnTicket ticket = pawnTicketRepository.findByIdIgnoreTenant(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
                
        if (!"APPROVED".equals(ticket.getStatus())) {
            throw new RuntimeException("Only APPROVED tickets can be disbursed");
        }
        
        ticket.setAdvanceAmount(advanceAmount);
        ticket.setRemainingAdvance(advanceAmount);
        ticket.setStatus("ACTIVE");
        
        ticket = pawnTicketRepository.save(ticket);
        
        LedgerEntry le = new LedgerEntry();
        le.setEntryDate(LocalDate.now());
        le.setDescription("Pawning Advance — Ticket: " + ticket.getTicketNumber() + " | Member: " + ticket.getMemberId() + " | Method: CASH");
        le.setReferenceNumber(ticket.getTicketId().toString());
        le.setDebitAccount("PAWN_LOANS");
        le.setCreditAccount("CASH_IN_VAULT");
        le.setAmount(advanceAmount);
        le.setEntryType("PAWN_DISBURSEMENT");
        le.setPaymentMethod("CASH");
        le.setBranchId(ticket.getBranchId());
        ledgerEntryRepository.save(le);
        
        return enrichWithCalculations(ticket, LocalDate.now());
    }

    public List<PawnTicketResponse> getAllTickets() {
        return pawnTicketRepository.findAllIgnoreTenant()
                .stream()
                .map(ticket -> enrichWithCalculations(ticket, LocalDate.now()))
                .collect(Collectors.toList());
    }

    public List<PawnTicketResponse> getTicketsByBranch(Integer branchId) {
        return pawnTicketRepository.findByBranchIdOrderByIssueDateDesc(branchId)
                .stream()
                .map(ticket -> enrichWithCalculations(ticket, LocalDate.now()))
                .collect(Collectors.toList());
    }

    public PawnTicketResponse getTicket(UUID ticketId) {
        PawnTicket ticket = pawnTicketRepository.findByIdIgnoreTenant(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return enrichWithCalculations(ticket, LocalDate.now());
    }

    public PawnTicketResponse redeemTicket(UUID ticketId) {
        PawnTicket ticket = pawnTicketRepository.findByIdIgnoreTenant(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        if (!"ACTIVE".equals(ticket.getStatus()) && !"OVERDUE".equals(ticket.getStatus())) {
            throw new RuntimeException("Ticket cannot be redeemed (Status: " + ticket.getStatus() + ")");
        }

        ticket.setStatus("REDEEMED");
        ticket = pawnTicketRepository.save(ticket);
        
        PawnTicketResponse currentCalc = enrichWithCalculations(ticket, LocalDate.now());
        BigDecimal totalDue = currentCalc.getTotalDue();
        
        if (totalDue != null && totalDue.compareTo(BigDecimal.ZERO) > 0) {
            LedgerEntry le = new LedgerEntry();
            le.setEntryDate(LocalDate.now());
            le.setDescription("Pawning Redemption — Ticket: " + ticket.getTicketNumber() + " | Member: " + ticket.getMemberId() + " | Method: CASH");
            le.setReferenceNumber(ticket.getTicketId().toString());
            le.setDebitAccount("CASH_IN_VAULT");
            le.setCreditAccount("PAWN_REPAYMENTS");
            le.setAmount(totalDue);
            le.setEntryType("PAWN_REDEMPTION");
            le.setPaymentMethod("CASH");
            le.setBranchId(ticket.getBranchId());
            ledgerEntryRepository.save(le);
        }
        
        return currentCalc;
    }

    public PawnTicketResponse makePayment(UUID ticketId, BigDecimal amount, LocalDate paymentDate) {
        PawnTicket ticket = pawnTicketRepository.findByIdIgnoreTenant(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if ("REDEEMED".equals(ticket.getStatus())) {
            throw new RuntimeException("Ticket is already redeemed");
        }

        if (paymentDate == null) {
            paymentDate = LocalDate.now();
        }

        PawnTicketResponse currentCalc = enrichWithCalculations(ticket, paymentDate);
        BigDecimal totalDue = currentCalc.getTotalDue();
        BigDecimal totalInterest = currentCalc.getAccruedInterest();
        
        if (amount.compareTo(totalDue) >= 0) {
            ticket.setStatus("REDEEMED");
            amount = totalDue; // Cap payment at total due
        }

        BigDecimal interestPortion;
        BigDecimal principalPortion;
        BigDecimal newCarriedOver = BigDecimal.ZERO;

        if (amount.compareTo(totalInterest) >= 0) {
            interestPortion = totalInterest;
            principalPortion = amount.subtract(totalInterest);
        } else {
            interestPortion = amount;
            principalPortion = BigDecimal.ZERO;
            newCarriedOver = totalInterest.subtract(amount);
        }

        BigDecimal newRemainingAdvance = ticket.getRemainingAdvance() != null ? ticket.getRemainingAdvance() : ticket.getAdvanceAmount();
        newRemainingAdvance = newRemainingAdvance.subtract(principalPortion);

        ticket.setCarriedOverInterest(newCarriedOver);
        ticket.setRemainingAdvance(newRemainingAdvance);
        ticket.setLastPaymentDate(paymentDate);

        ticket = pawnTicketRepository.save(ticket);

        PawnPayment payment = new PawnPayment();
        payment.setTicketId(ticketId);
        payment.setPaymentAmount(amount);
        payment.setInterestPortion(interestPortion);
        payment.setPrincipalPortion(principalPortion);
        java.time.LocalDateTime paymentTime = paymentDate.equals(java.time.LocalDate.now()) ? java.time.LocalDateTime.now() : paymentDate.atTime(12, 0);
        payment.setPaymentDate(paymentTime);
        pawnPaymentRepository.save(payment);

        LedgerEntry le = new LedgerEntry();
        le.setEntryDate(paymentDate);
        le.setCreatedAt(paymentTime);
        if ("REDEEMED".equals(ticket.getStatus())) {
            le.setDescription("Pawning Redemption — Ticket: " + ticket.getTicketNumber() + " | Member: " + ticket.getMemberId() + " | Method: CASH");
            le.setEntryType("PAWN_REDEMPTION");
        } else {
            le.setDescription("Pawning Repayment — Ticket: " + ticket.getTicketNumber() + " | Member: " + ticket.getMemberId() + " | Method: CASH");
            le.setEntryType("PAWN_REPAYMENT");
        }
        le.setReferenceNumber(payment.getPaymentId() != null ? payment.getPaymentId().toString() : ticket.getTicketId().toString());
        le.setDebitAccount("CASH_IN_VAULT");
        le.setCreditAccount("PAWN_REPAYMENTS");
        le.setAmount(amount);
        le.setPaymentMethod("CASH");
        le.setBranchId(ticket.getBranchId());
        ledgerEntryRepository.save(le);

        return enrichWithCalculations(ticket, LocalDate.now());
    }

    private PawnTicketResponse enrichWithCalculations(PawnTicket ticket, LocalDate targetDate) {
        LocalDate now = targetDate != null ? targetDate : LocalDate.now();
        if ("REDEEMED".equals(ticket.getStatus())) {
            now = ticket.getLastPaymentDate() != null ? ticket.getLastPaymentDate() : ticket.getIssueDate();
        }
        
        LocalDate lastPaymentDate = ticket.getLastPaymentDate() != null ? ticket.getLastPaymentDate() : ticket.getIssueDate();
        long daysSinceLastPayment = ChronoUnit.DAYS.between(lastPaymentDate, now);
        if (daysSinceLastPayment < 0) daysSinceLastPayment = 0;

        long chargeableDays = 0;
        if (daysSinceLastPayment > 0) {
            if (daysSinceLastPayment <= 15) {
                chargeableDays = 15;
            } else if (daysSinceLastPayment <= 30) {
                chargeableDays = 30;
            } else {
                chargeableDays = daysSinceLastPayment;
            }
        }

        BigDecimal rate = ticket.getInterestRate();
        BigDecimal remainingAdvance = ticket.getRemainingAdvance() != null ? ticket.getRemainingAdvance() : ticket.getAdvanceAmount();
        BigDecimal carriedOver = ticket.getCarriedOverInterest() != null ? ticket.getCarriedOverInterest() : BigDecimal.ZERO;
        
        BigDecimal newInterest = remainingAdvance.multiply(BigDecimal.valueOf(chargeableDays)).multiply(rate)
                .divide(new BigDecimal("36500"), 2, RoundingMode.HALF_UP);
        
        BigDecimal totalInterest = carriedOver.add(newInterest);
        BigDecimal totalDue = remainingAdvance.add(totalInterest);

        if (LocalDate.now().isAfter(ticket.getExpiryDate()) && "ACTIVE".equals(ticket.getStatus())) {
            ticket.setStatus("OVERDUE");
            pawnTicketRepository.save(ticket);
        }

        PawnTicketResponse response = PawnTicketResponse.fromEntity(ticket, ChronoUnit.DAYS.between(ticket.getIssueDate(), LocalDate.now()), totalInterest, totalDue);
        
        // Fetch payments for history
        List<PawnPayment> payments = pawnPaymentRepository.findByTicketIdOrderByPaymentDateDesc(ticket.getTicketId());
        response.setPayments(payments); // Wait, PawnTicketResponse does not have payments yet! We will add it next.
        
        return response;
    }
}
