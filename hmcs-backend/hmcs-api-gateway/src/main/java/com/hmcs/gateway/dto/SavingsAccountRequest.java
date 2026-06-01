package com.hmcs.gateway.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SavingsAccountRequest {
    private java.util.UUID memberId;
    private String accountType; // REGULAR, CHILD, SENIOR
    private BigDecimal initialDeposit;
}


