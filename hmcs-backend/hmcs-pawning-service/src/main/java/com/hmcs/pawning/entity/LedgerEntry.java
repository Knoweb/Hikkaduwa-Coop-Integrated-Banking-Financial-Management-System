package com.hmcs.pawning.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries", schema = "loan_service")
@Data
public class LedgerEntry {
    @TenantId
    private Integer tenantId;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "entry_id", updatable = false, nullable = false)
    private UUID entryId;

    @Column(name = "loan_id")
    private UUID loanId;

    @Column(name = "reference_number", length = 50)
    private String referenceNumber;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "debit_account", length = 100, nullable = false)
    private String debitAccount;

    @Column(name = "credit_account", length = 100, nullable = false)
    private String creditAccount;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "entry_type", length = 50)
    private String entryType;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "branch_id")
    private Integer branchId;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
