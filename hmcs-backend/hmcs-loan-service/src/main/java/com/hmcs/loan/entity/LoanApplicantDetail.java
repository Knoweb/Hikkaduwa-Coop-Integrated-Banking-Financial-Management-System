package com.hmcs.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stores all Form 1108 applicant personal & financial details.
 * One-to-one with the Loan entity.
 */
@Entity
@Table(name = "loan_applicant_details", schema = "loan_service")
@Data
public class LoanApplicantDetail {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "detail_id", updatable = false, nullable = false)
    private UUID detailId;

    @Column(name = "loan_id", nullable = false, unique = true)
    private UUID loanId;

    // ── පෞද්ගලික තොරතුරු (Personal Info) ──────────────────────────────────────
    @Column(name = "applicant_name", length = 200)
    private String applicantName;

    @Column(name = "address_line1", length = 300)
    private String addressLine1;

    @Column(name = "address_line2", length = 300)
    private String addressLine2;

    @Column(name = "branch", length = 100)
    private String branch;

    @Column(name = "shares_obtained", precision = 15, scale = 2)
    private BigDecimal sharesObtained;

    @Column(name = "date_of_birth")
    private String dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "civil_status", length = 20)
    private String civilStatus;

    @Column(name = "nic", length = 20)
    private String nic;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "member_no", length = 50)
    private String memberNo;

    @Column(name = "residence_period", length = 50)
    private String residencePeriod;

    @Column(name = "is_member_of_other_coop")
    private Boolean isMemberOfOtherCoop;

    @Column(name = "other_coop_details", length = 300)
    private String otherCoopDetails;

    @Column(name = "province", length = 100)
    private String province;

    // ── ණය විස්තර (Loan Details) ───────────────────────────────────────────────
    @Column(name = "guarantor_of_other_loan1", length = 200)
    private String guarantorOfOtherLoan1;

    @Column(name = "guarantor_of_other_loan2", length = 200)
    private String guarantorOfOtherLoan2;

    @Column(name = "required_loan_cash", precision = 15, scale = 2)
    private BigDecimal requiredLoanCash;

    @Column(name = "required_loan_goods", precision = 15, scale = 2)
    private BigDecimal requiredLoanGoods;

    @Column(name = "loan_purpose", columnDefinition = "TEXT")
    private String loanPurpose;

    @Column(name = "repayment_period_months")
    private Integer repaymentPeriodMonths;

    // ── රැකියා විස්තර (Employment) ─────────────────────────────────────────────
    @Column(name = "primary_job", length = 200)
    private String primaryJob;

    @Column(name = "employer_details", length = 300)
    private String employerDetails;

    @Column(name = "spouse_job_title", length = 200)
    private String spouseJobTitle;

    @Column(name = "spouse_employer_details", length = 300)
    private String spouseEmployerDetails;

    @Column(name = "head_of_household_name", length = 200)
    private String headOfHouseholdName;

    @Column(name = "dependents_count")
    private Integer dependentsCount;

    // ── ආදායම් / වියදම් (Income & Expenses) ──────────────────────────────────
    @Column(name = "annual_income_primary", precision = 15, scale = 2)
    private BigDecimal annualIncomePrimary;

    @Column(name = "annual_income_other", precision = 15, scale = 2)
    private BigDecimal annualIncomeOther;

    @Column(name = "annual_expense", precision = 15, scale = 2)
    private BigDecimal annualExpense;

    // ── පවතින ණය (Existing Loans) ─────────────────────────────────────────────
    @Column(name = "existing_loans_coop", precision = 15, scale = 2)
    private BigDecimal existingLoansCoop;

    @Column(name = "existing_loans_other", precision = 15, scale = 2)
    private BigDecimal existingLoansOther;

    // ── ව්‍යසනය ණය (Disaster Loan specific) ──────────────────────────────────
    @Column(name = "designation", length = 200)
    private String designation;

    @Column(name = "share_amount", precision = 15, scale = 2)
    private BigDecimal shareAmount;

    @Column(name = "agreed_amount", precision = 15, scale = 2)
    private BigDecimal agreedAmount;

    // ── ඩිජිටල් අත්සන (Applicant Signature) ──────────────────────────────────
    @Column(name = "applicant_digital_signature_url", columnDefinition = "TEXT")
    private String applicantDigitalSignatureUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
