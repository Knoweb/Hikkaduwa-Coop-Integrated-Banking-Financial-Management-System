package com.hmcs.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "loan_schedules")
@Data
public class LoanSchedule {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "loan_id", nullable = false)
    private UUID loanId;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "expected_principal", nullable = false, precision = 15, scale = 2)
    private BigDecimal expectedPrincipal;

    @Column(name = "expected_interest", nullable = false, precision = 15, scale = 2)
    private BigDecimal expectedInterest;

    @Column(name = "total_expected_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalExpectedAmount;

    @Column(name = "outstanding_balance", precision = 15, scale = 2)
    private BigDecimal outstandingBalance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleStatus status;

    public enum ScheduleStatus {
        PENDING,
        PAID,
        OVERDUE
    }
}
