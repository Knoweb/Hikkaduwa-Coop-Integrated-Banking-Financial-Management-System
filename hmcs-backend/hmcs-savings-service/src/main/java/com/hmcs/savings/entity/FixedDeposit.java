package com.hmcs.savings.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "fixed_deposits", schema = "account_service")
public class FixedDeposit {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID fdId;

    @Column(name = "type_id")
    private UUID typeId;

    @Column(nullable = false)
    private UUID memberId;

    @Column(name = "member_id_2")
    private UUID memberId2;

    @Column(name = "member_id_3")
    private UUID memberId3;

    @Column(nullable = false, unique = true, length = 50)
    private String fdNumber;

    @Column
    private UUID linkedSavingsAccountId;

    @Column(length = 50)
    private String receiptNumber;

    @Column(length = 20)
    private String interestPayoutMethod = "AT_MATURITY";

    @Column(nullable = false, length = 50)
    private String maturityInstruction = "REINVEST_PRINCIPAL_AND_INTEREST";

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal principalAmount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(nullable = false)
    private Integer termMonths;

    @Column(nullable = false)
    private LocalDate openedDate = LocalDate.now();

    @Column
    private LocalDate lastInterestPayoutDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal accumulatedInterest = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDate maturityDate;

    @Column(name = "is_officer_approved")
    private Boolean isOfficerApproved = false;

    @Column(columnDefinition = "TEXT", name = "depositor_signature")
    private String depositorSignature;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(name = "has_submitted_tax_form")
    private Boolean hasSubmittedTaxForm = false;
}
