package com.hmcs.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loan_approval_actions")
@Data
public class LoanApprovalAction {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "action_id", updatable = false, nullable = false)
    private UUID actionId;

    @Column(name = "loan_id", nullable = false)
    private UUID loanId;

    @Column(name = "stage", length = 100, nullable = false)
    private String stage;

    @Column(name = "action", length = 20, nullable = false)
    // APPROVED, REJECTED, FORWARDED, NOTED
    private String action;

    @Column(name = "actor_username", length = 100)
    private String actorUsername;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
