package com.hmcs.loan.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loan_repayments")
@Data
public class LoanRepayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "loan_id", nullable = false)
    private UUID loanId;

    @Column(name = "payment_branch_id", nullable = false)
    private Long paymentBranchId;

    @Column(name = "processed_by", nullable = false)
    private UUID processedBy;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate = LocalDateTime.now();

    @Column(name = "total_paid", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPaid;

    @Column(name = "principal_portion", nullable = false, precision = 15, scale = 2)
    private BigDecimal principalPortion;

    @Column(name = "interest_portion", nullable = false, precision = 15, scale = 2)
    private BigDecimal interestPortion;

    @Column(name = "penalty_paid", nullable = false, precision = 15, scale = 2)
    private BigDecimal penaltyPaid = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "reference", length = 255)
    private String reference;

    public enum PaymentMethod {
        CASH,
        SAVINGS_TRANSFER
    }
}
