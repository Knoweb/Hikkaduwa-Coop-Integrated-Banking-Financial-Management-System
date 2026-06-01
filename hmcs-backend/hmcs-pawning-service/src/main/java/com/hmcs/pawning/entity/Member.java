package com.hmcs.pawning.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "members", schema = "member_service")
@Data
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private java.util.UUID memberId;
    
    @Column(name = "registered_branch_id")
    private Long branchId; // Multi-branch data isolation
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(unique = true)
    private String nic;
    
    private String address;
    
    @Column(name = "contact_number")
    private String contactNumber;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Column(name = "digital_signature_url")
    private String digitalSignatureUrl;
    
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

