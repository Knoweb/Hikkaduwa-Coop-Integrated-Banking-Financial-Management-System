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
}
