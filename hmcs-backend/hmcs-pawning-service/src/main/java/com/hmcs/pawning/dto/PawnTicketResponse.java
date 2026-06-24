package com.hmcs.pawning.dto;

import com.hmcs.pawning.entity.PawnTicket;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class PawnTicketResponse {
    private UUID ticketId;
    private String ticketNumber;
    private UUID memberId;
    private String articleDescription;
    private BigDecimal grossWeightGrams;
    private BigDecimal netWeightGrams;
    private Integer purityKarat;
    private BigDecimal assessedValue;
    private BigDecimal advanceAmount;
    private BigDecimal interestRate;
    private Integer branchId;
    private UUID valuerId;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String status;

    // Computed fields
    private Long daysElapsed;
    private BigDecimal accruedInterest;
    private BigDecimal totalDue;

    public static PawnTicketResponse fromEntity(PawnTicket ticket, Long daysElapsed, BigDecimal accruedInterest, BigDecimal totalDue) {
        PawnTicketResponse response = new PawnTicketResponse();
        response.setTicketId(ticket.getTicketId());
        response.setTicketNumber(ticket.getTicketNumber());
        response.setMemberId(ticket.getMemberId());
        response.setArticleDescription(ticket.getArticleDescription());
        response.setGrossWeightGrams(ticket.getGrossWeightGrams());
        response.setNetWeightGrams(ticket.getNetWeightGrams());
        response.setPurityKarat(ticket.getPurityKarat());
        response.setAssessedValue(ticket.getAssessedValue());
        response.setAdvanceAmount(ticket.getAdvanceAmount());
        response.setInterestRate(ticket.getInterestRate());
        response.setBranchId(ticket.getBranchId());
        response.setValuerId(ticket.getValuerId());
        response.setIssueDate(ticket.getIssueDate());
        response.setExpiryDate(ticket.getExpiryDate());
        response.setStatus(ticket.getStatus());
        
        response.setDaysElapsed(daysElapsed);
        response.setAccruedInterest(accruedInterest);
        response.setTotalDue(totalDue);
        return response;
    }
}
