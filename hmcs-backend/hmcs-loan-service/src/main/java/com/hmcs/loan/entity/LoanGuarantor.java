package com.hmcs.loan.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Stores guarantor details for a loan application.
 * Each loan can have multiple guarantors (guarantor_number = 1, 2, etc.)
 */
@Entity
@Table(name = "loan_guarantors", schema = "loan_service")
@Data
public class LoanGuarantor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "guarantor_id", updatable = false, nullable = false)
    private UUID guarantorId;

    @Column(name = "loan_id", nullable = false)
    private UUID loanId;

    /** 1 = first guarantor, 2 = second guarantor */
    @Column(name = "guarantor_number", nullable = false)
    private Integer guarantorNumber;

    // ── පෞද්ගලික (Personal) ──────────────────────────────────────────────────
    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(name = "address", length = 400)
    private String address;

    @Column(name = "nic", length = 20)
    private String nic;

    @Column(name = "date_of_birth", length = 20)
    private String dateOfBirth;

    @Column(name = "member_no", length = 50)
    private String memberNo;

    @Column(name = "job", length = 200)
    private String job;

    @Column(name = "phone", length = 20)
    private String phone;

    // ── වත්කම් (Assets) ──────────────────────────────────────────────────────
    @Column(name = "asset_land_value", precision = 15, scale = 2)
    private BigDecimal assetLandValue;

    @Column(name = "asset_vehicles_value", precision = 15, scale = 2)
    private BigDecimal assetVehiclesValue;

    @Column(name = "asset_animals_value", precision = 15, scale = 2)
    private BigDecimal assetAnimalsValue;

    @Column(name = "asset_other_value", precision = 15, scale = 2)
    private BigDecimal assetOtherValue;

    // ── බැංකු ශේෂය (Bank Balances) ───────────────────────────────────────────
    @Column(name = "bank_dhana_yojana", precision = 15, scale = 2)
    private BigDecimal bankDhanaYojana;

    @Column(name = "bank_savings", precision = 15, scale = 2)
    private BigDecimal bankSavings;

    @Column(name = "bank_fixed", precision = 15, scale = 2)
    private BigDecimal bankFixed;

    // ── ආදායම (Income) ────────────────────────────────────────────────────────
    @Column(name = "annual_income_primary", precision = 15, scale = 2)
    private BigDecimal annualIncomePrimary;

    @Column(name = "annual_income_other", precision = 15, scale = 2)
    private BigDecimal annualIncomeOther;

    // ── ඩිජිටල් අත්සන (Digital Signature) ───────────────────────────────────
    @Column(name = "digital_signature_url", columnDefinition = "TEXT")
    private String digitalSignatureUrl;
}
