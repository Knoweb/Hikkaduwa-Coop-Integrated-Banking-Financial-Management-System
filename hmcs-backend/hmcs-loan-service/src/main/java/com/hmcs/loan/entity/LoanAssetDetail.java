package com.hmcs.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Stores applicant asset details (land, vehicles, animals, etc.)
 * and bank account balances as per Form 1108 Section 3.
 */
@Entity
@Table(name = "loan_asset_details", schema = "loan_service")
@Data
public class LoanAssetDetail {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "asset_id", updatable = false, nullable = false)
    private UUID assetId;

    @Column(name = "loan_id", nullable = false, unique = true)
    private UUID loanId;

    // ── ඉඩම් (Land) ──────────────────────────────────────────────────────────
    @Column(name = "land_goda_value", precision = 15, scale = 2)
    private BigDecimal landGodaValue;

    @Column(name = "land_mada_value", precision = 15, scale = 2)
    private BigDecimal landMadaValue;

    // ── ගොඩනැගිලි (Buildings) ──────────────────────────────────────────────
    @Column(name = "buildings_value", precision = 15, scale = 2)
    private BigDecimal buildingsValue;

    // ── වාහන (Vehicles) ───────────────────────────────────────────────────────
    @Column(name = "vehicles_value", precision = 15, scale = 2)
    private BigDecimal vehiclesValue;

    // ── සතුන් (Animals / Livestock) ──────────────────────────────────────────
    @Column(name = "animals_value", precision = 15, scale = 2)
    private BigDecimal animalsValue;

    // ── වෙනත් (Other) ─────────────────────────────────────────────────────────
    @Column(name = "other_assets_value", precision = 15, scale = 2)
    private BigDecimal otherAssetsValue;

    @Column(name = "other_assets_description", length = 300)
    private String otherAssetsDescription;

    // ── බැංකු ගිණුම් ශේෂය (Bank Account Balances) ────────────────────────────
    @Column(name = "bank_current_branch", length = 100)
    private String bankCurrentBranch;

    @Column(name = "bank_current_acc_no", length = 50)
    private String bankCurrentAccNo;

    @Column(name = "bank_current_balance", precision = 15, scale = 2)
    private BigDecimal bankCurrentBalance;

    @Column(name = "bank_dhana_yojana_branch", length = 100)
    private String bankDhanaYojanaBranch;

    @Column(name = "bank_dhana_yojana_acc_no", length = 50)
    private String bankDhanaYojanaAccNo;

    @Column(name = "bank_dhana_yojana_balance", precision = 15, scale = 2)
    private BigDecimal bankDhanaYojanaBalance;

    @Column(name = "bank_savings_branch", length = 100)
    private String bankSavingsBranch;

    @Column(name = "bank_savings_acc_no", length = 50)
    private String bankSavingsAccNo;

    @Column(name = "bank_savings_balance", precision = 15, scale = 2)
    private BigDecimal bankSavingsBalance;

    @Column(name = "bank_fixed_branch", length = 100)
    private String bankFixedBranch;

    @Column(name = "bank_fixed_acc_no", length = 50)
    private String bankFixedAccNo;

    @Column(name = "bank_fixed_balance", precision = 15, scale = 2)
    private BigDecimal bankFixedBalance;
}
