package com.hmcs.loan.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries")
@Data
public class LedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "entry_id", updatable = false, nullable = false)
    private UUID entryId;

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

    // e.g. LOAN_RECEIVABLE, CASH, SAVINGS_DEPOSITS, INTEREST_INCOME
    @Column(name = "debit_account", length = 100, nullable = false)
    private String debitAccount;

    // e.g. CASH, SAVINGS_DEPOSITS
    @Column(name = "credit_account", length = 100, nullable = false)
    private String creditAccount;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    // DISBURSEMENT, REPAYMENT, INTEREST, ADJUSTMENT
    @Column(name = "entry_type", length = 50)
    private String entryType;

    // CASH or SAVINGS_TRANSFER
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
