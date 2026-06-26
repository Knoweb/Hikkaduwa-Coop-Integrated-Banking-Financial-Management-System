package com.hmcs.pawning.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class IssueTicketRequest {
    private UUID memberId;
    private String articleDescription;
    private BigDecimal grossWeightGrams;
    private BigDecimal netWeightGrams;
    private Integer purityKarat;
    private BigDecimal assessedValue;
    private BigDecimal advanceAmount;
    private Integer branchId;
    private UUID valuerId;
    private String ticketNumber; // Optional, can be provided manually
    private BigDecimal interestRate; // Optional, defaults to 13
    private java.time.LocalDate issueDate; // Optional
}
