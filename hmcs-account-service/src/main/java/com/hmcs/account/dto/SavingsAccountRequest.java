package com.hmcs.account.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SavingsAccountRequest {
    private Long memberId;
    private String accountType;
    private BigDecimal initialDeposit;
}
