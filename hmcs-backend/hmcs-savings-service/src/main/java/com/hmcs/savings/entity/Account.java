package com.hmcs.savings.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "accounts", schema = "account_service")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID accountId;

    @Column(nullable = false, unique = true, length = 20)
    private String accountNumber;

    @Column(nullable = false)
    private UUID memberId;

    @Column(nullable = false, length = 50)
    private String accountType;

    @Column(precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

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
