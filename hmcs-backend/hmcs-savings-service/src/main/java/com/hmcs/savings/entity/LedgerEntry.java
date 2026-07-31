package com.hmcs.savings.entity;

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

    @Column(name = "transaction_id")
    private UUID transactionId;

    // The loan this GL entry is linked to (optional, for loan disbursements)
    @Column(name = "loan_id")
    private UUID loanId;

    // e.g. "LN-HKW-2026-0012"
    @Column(name = "reference_number", length = 50)
    private String referenceNumber;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // e.g. LOAN_RECEIVABLE, CASH_IN_VAULT, SAVINGS_DEPOSITS, INTEREST_INCOME
    @Column(name = "debit_account", length = 100, nullable = false)
    private String debitAccount;

    // e.g. CASH_IN_VAULT, SAVINGS_DEPOSITS
    @Column(name = "credit_account", length = 100, nullable = false)
    private String creditAccount;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    // DISBURSEMENT, REPAYMENT, INTEREST, ADJUSTMENT, DEPOSIT, WITHDRAWAL
    @Column(name = "entry_type", length = 50)
    private String entryType;

    // CASH or SAVINGS_TRANSFER
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "branch_id")
    private Integer branchId;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
