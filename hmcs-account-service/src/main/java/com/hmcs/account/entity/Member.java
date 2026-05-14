package com.hmcs.account.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "members", schema = "member_service")
@Data
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long memberId;
    
    private Long branchId; // Multi-branch data isolation
    
    private String fullName;
    
    @Column(unique = true)
    private String nic;
    
    private String address;
    private String contactNumber;
    private LocalDate dateOfBirth;
    
    private String status; // ACTIVE, INACTIVE
    
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }
}
