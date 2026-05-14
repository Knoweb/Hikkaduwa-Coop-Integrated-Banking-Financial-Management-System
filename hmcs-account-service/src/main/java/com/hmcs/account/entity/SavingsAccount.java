package com.hmcs.account.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "savings_accounts", schema = "member_service")
@Data
public class SavingsAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;
    
    @Column(unique = true, nullable = false)
    private String accountNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    private Long branchId; // Multi-branch data isolation
    
    private BigDecimal balance;
    
    private String accountType; // REGULAR, CHILD, SENIOR
    private String status; // ACTIVE, DORMANT, CLOSED
    
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.balance == null) {
            this.balance = BigDecimal.ZERO;
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }
}
