package com.hmcs.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "loans")
@Data
public class Loan {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "loan_id", updatable = false, nullable = false)
    private UUID loanId;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "loan_type_id", referencedColumnName = "loan_type_id")
    private LoanType loanType;

    @Column(name = "loan_type")
    private String loanTypeStr;

    @Column(name = "requested_amount", precision = 15, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "approved_amount", precision = 15, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "interest_rate", precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "term_months")
    private Integer termMonths;

    @Column(name = "branch_id")
    private Integer branchId;

    @Column(name = "current_stage", length = 50)
    private String currentStage = "STAGE_1_MANAGER_APPROVAL";

    @Column(name = "status", length = 20)
    private String status = "PENDING"; 

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    @Column(name = "application_number", length = 100)
    private String applicationNumber;

    @Column(name = "repayment_method", length = 30)
    private String repaymentMethod = "BRANCH_TELLER";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "application_data", columnDefinition = "jsonb")
    private Map<String, Object> applicationData;

    @Column(name = "account_number", length = 50, unique = true)
    private String accountNumber;

    @org.hibernate.annotations.Formula("(COALESCE(disbursed_amount, requested_amount, 0) - COALESCE((SELECT SUM(r.principal_portion) FROM loan_service.loan_repayments r WHERE r.loan_id = loan_id), 0))")
    private BigDecimal outstandingBalance;

    @Column(name = "disbursement_date")
    private LocalDateTime disbursementDate;

    @Column(name = "disbursed_amount", precision = 15, scale = 2)
    private BigDecimal disbursedAmount;

    @Column(name = "disbursed_by", length = 100)
    private String disbursedBy;

    @Column(name = "evaluator_id")
    private UUID evaluatorId;

    @Column(name = "evaluation_status", length = 50)
    private String evaluationStatus;

    @Column(name = "evaluation_notes", columnDefinition = "text")
    private String evaluationNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
