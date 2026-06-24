package com.hmcs.pawning.service;

import com.hmcs.pawning.dto.IssueTicketRequest;
import com.hmcs.pawning.dto.PawnTicketResponse;
import com.hmcs.pawning.entity.PawnTicket;
import com.hmcs.pawning.repository.PawnTicketRepository;
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

        ticket.setIssueDate(LocalDate.now());
        ticket.setExpiryDate(LocalDate.now().plusYears(1));
        
        // Generate a 6-digit ticket number, e.g., 698594
        long count = pawnTicketRepository.count();
        ticket.setTicketNumber(String.format("%06d", 698594 + count)); // Just a starting sequence similar to the image

        ticket = pawnTicketRepository.save(ticket);
        return enrichWithCalculations(ticket);
    }

    public List<PawnTicketResponse> getTicketsByBranch(Integer branchId) {
        return pawnTicketRepository.findByBranchIdOrderByIssueDateDesc(branchId)
                .stream()
                .map(this::enrichWithCalculations)
                .collect(Collectors.toList());
    }

    public PawnTicketResponse getTicket(UUID ticketId) {
        PawnTicket ticket = pawnTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return enrichWithCalculations(ticket);
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
        
        return enrichWithCalculations(ticket);
    }

    private PawnTicketResponse enrichWithCalculations(PawnTicket ticket) {
        LocalDate now = LocalDate.now();
        // If redeemed, use the current date or should save redemption date? 
        // For simplicity, if it's redeemed, ideally we should stop calculating interest, 
        // but we need a redeemedDate field. For now, let's calculate up to today.
        
        long daysElapsed = ChronoUnit.DAYS.between(ticket.getIssueDate(), now);
        if (daysElapsed < 0) daysElapsed = 0;

        // Interest = (Amount × Days × 13) ÷ 36,500
        BigDecimal rate = ticket.getInterestRate();
        BigDecimal advance = ticket.getAdvanceAmount();
        
        BigDecimal interest = advance.multiply(BigDecimal.valueOf(daysElapsed)).multiply(rate)
                .divide(new BigDecimal("36500"), 2, RoundingMode.HALF_UP);
        
        BigDecimal totalDue = advance.add(interest);

        // Auto-update status to OVERDUE if > 1 year and still ACTIVE
        if (now.isAfter(ticket.getExpiryDate()) && "ACTIVE".equals(ticket.getStatus())) {
            ticket.setStatus("OVERDUE");
            pawnTicketRepository.save(ticket);
        }

        return PawnTicketResponse.fromEntity(ticket, daysElapsed, interest, totalDue);
    }
}
