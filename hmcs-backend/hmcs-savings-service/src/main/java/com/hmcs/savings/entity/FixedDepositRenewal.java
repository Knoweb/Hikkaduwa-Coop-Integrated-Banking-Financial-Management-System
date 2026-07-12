package com.hmcs.savings.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "fixed_deposit_renewals")
public class FixedDepositRenewal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "old_fd_id", nullable = false)
    private UUID oldFdId;

    @Column(name = "new_fd_id", nullable = false)
    private UUID newFdId;

    @Column(name = "renewal_date", nullable = false)
    private LocalDate renewalDate = LocalDate.now();

    @Column(name = "reinvested_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal reinvestedAmount;

    @Column(name = "processed_by")
    private UUID processedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "tenant_id")
    private Integer tenantId;
    
    @Column(name = "branch_id")
    private Integer branchId;
}
