package com.hmcs.pawning.service;

import com.hmcs.pawning.dto.IssueTicketRequest;
import com.hmcs.pawning.dto.PawnTicketResponse;
import com.hmcs.pawning.entity.PawnTicket;
import com.hmcs.pawning.entity.PawnPayment;
import com.hmcs.pawning.repository.PawnTicketRepository;
import com.hmcs.pawning.repository.PawnPaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

        ticket = pawnTicketRepository.save(ticket);
        return enrichWithCalculations(ticket, LocalDate.now());
    }

    public List<PawnTicketResponse> getTicketsByBranch(Integer branchId) {
        return pawnTicketRepository.findByBranchIdOrderByIssueDateDesc(branchId)
                .stream()
                .map(ticket -> enrichWithCalculations(ticket, LocalDate.now()))
                .collect(Collectors.toList());
    }

    public PawnTicketResponse getTicket(UUID ticketId) {
        PawnTicket ticket = pawnTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return enrichWithCalculations(ticket, LocalDate.now());
    }

    public PawnTicketResponse redeemTicket(UUID ticketId) {
        PawnTicket ticket = pawnTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        if (!"ACTIVE".equals(ticket.getStatus()) && !"OVERDUE".equals(ticket.getStatus())) {
            throw new RuntimeException("Ticket cannot be redeemed (Status: " + ticket.getStatus() + ")");
        }

        ticket.setStatus("REDEEMED");
        ticket = pawnTicketRepository.save(ticket);
        
        // TODO: Call ledger service via API Gateway or Feign Client to record the transaction
        
        return enrichWithCalculations(ticket, LocalDate.now());
    }

    public PawnTicketResponse makePayment(UUID ticketId, BigDecimal amount, LocalDate paymentDate) {
        PawnTicket ticket = pawnTicketRepository.findById(ticketId)
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
        payment.setPaymentDate(paymentDate.atStartOfDay());
        pawnPaymentRepository.save(payment);

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
            long months = daysSinceLastPayment / 30;
            long rem = daysSinceLastPayment % 30;
            
            if (rem == 0) {
                chargeableDays = months * 30;
            } else if (rem <= 15) {
                chargeableDays = months * 30 + 15;
            } else {
                chargeableDays = (months + 1) * 30;
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
