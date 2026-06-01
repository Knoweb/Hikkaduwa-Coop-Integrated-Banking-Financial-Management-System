package com.hmcs.reporting.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransactionRequest {
    private String accountNumber;
    private BigDecimal amount;
}


