package com.hmcs.savings.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Entity
@Table(name = "fixed_deposit_types", schema = "account_service")

public class FixedDepositType {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // e.g., "FD_3M", "FD_1Y_SENIOR"

    @Column(nullable = false, length = 100)
    private String name; // e.g., "මාස 3 ස්ථාවර තැන්පතු"

    @Column(nullable = false)
    private Integer termMonths;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRateMonthly; // Interest rate if payout is Monthly

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRateMaturity; // Interest rate if payout is at Maturity

    @Column(nullable = false)
    private Boolean isSeniorCitizen = false;

    @Column(nullable = false)
    private Boolean isActive = true;
}
