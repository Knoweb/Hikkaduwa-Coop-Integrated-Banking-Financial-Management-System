package com.hmcs.savings.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "fixed_deposits", schema = "account_service")
public class FixedDeposit {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID fdId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal principalAmount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(nullable = false)
    private Integer termMonths;

    @Column(nullable = false)
    private LocalDate maturityDate;

    @Column(length = 20)
    private String status = "ACTIVE";
}
