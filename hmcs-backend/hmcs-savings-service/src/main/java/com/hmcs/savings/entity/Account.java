package com.hmcs.savings.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "savings_accounts", schema = "account_service")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID accountId;

    @Column(nullable = false, unique = true, length = 20)
    private String accountNumber;

    // Primary Member
    @Column(nullable = false)
    private UUID memberId;

    // Joint Members (Optional)
    @Column(name = "member_id_2")
    private UUID memberId2;

    @Column(name = "member_id_3")
    private UUID memberId3;

    @Column(name = "occupation1")
    private String occupation1;

    @Column(name = "occupation2")
    private String occupation2;

    @Column(name = "occupation3")
    private String occupation3;

    @Column(name = "account_mode", length = 20)
    private String accountMode = "SINGLE"; // SINGLE, JOINT

    @Column(name = "mode_of_operation", length = 50)
    private String modeOfOperation = "SELF"; 

    // Witness Information
    @Column(name = "witness_name", length = 150)
    private String witnessName;

    @Column(name = "witness_address", length = 250)
    private String witnessAddress;

    // Specimen Signature
    @Column(name = "specimen_signature", columnDefinition = "TEXT")
    private String specimenSignature;

    @Column(nullable = false, length = 50)
    private String accountType;

    @Column(precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "initial_deposit", precision = 15, scale = 2)
    private BigDecimal initialDeposit = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer branchId;

    @Column(updatable = false)
    private LocalDate openedDate = LocalDate.now();

    @Column(length = 20)
    private String status = "ACTIVE";

    // Fields for Children's Savings Accounts
    @Column(name = "child_name", length = 150)
    private String childName;

    @Column(name = "child_birth_certificate", length = 50)
    private String childBirthCertificate;

    @Column(name = "child_date_of_birth")
    private LocalDate childDateOfBirth;

    // Interest rate configuration
    @Column(precision = 5, scale = 4)
    private BigDecimal annualInterestRate = new BigDecimal("0.0600"); // 6% by default
}
