package com.hmcs.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "pending_field_collections", schema = "loan_service")
public class PendingFieldCollection {

    @TenantId
    @Column(name = "tenant_id")
    private Integer tenantId;

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "loan_id", nullable = false)
    private UUID loanId;

    @Column(name = "field_officer_username", nullable = false)
    private String fieldOfficerUsername;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status; // PENDING, HANDED_OVER

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "branch_id", nullable = false)
    private Long branchId;
}
