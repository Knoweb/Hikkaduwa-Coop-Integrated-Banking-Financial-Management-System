package com.hmcs.savings.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "pending_approvals", schema = "account_service")
public class PendingApproval {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID approvalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, length = 20)
    private String transactionType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private UUID requestedBy;

    @Column(length = 20)
    private String status = "PENDING";

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private UUID managerId;

    private LocalDateTime resolvedAt;
}

