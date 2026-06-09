package com.hmcs.savings.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "daily_balances", schema = "account_service")
public class DailyBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal closingBalance = BigDecimal.ZERO;
    
    @Column(precision = 5, scale = 4)
    private BigDecimal annualInterestRate; // E.g., 0.0600 for 6%
}
