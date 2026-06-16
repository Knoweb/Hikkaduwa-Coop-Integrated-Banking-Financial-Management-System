package com.hmcs.loan.entity;

import jakarta.persistence.*;
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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "loan_id", updatable = false, nullable = false)
    private UUID loanId;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "loan_type_id", referencedColumnName = "loan_type_id")
    private LoanType loanType;

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
    private String currentStage = "STAGE_1_APPLICATION_SUBMITTED";

    @Column(name = "status", length = 20)
    private String status = "PENDING"; 

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    // JSONB Column for Dynamic Application Forms
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "application_data", columnDefinition = "jsonb")
    private Map<String, Object> applicationData;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
