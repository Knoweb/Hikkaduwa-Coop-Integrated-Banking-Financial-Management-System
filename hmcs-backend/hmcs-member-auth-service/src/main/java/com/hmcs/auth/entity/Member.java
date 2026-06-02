package com.hmcs.auth.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "members", schema = "member_service")
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID memberId;

    @Column(nullable = false, unique = true, length = 20)
    private String nic;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(length = 15)
    private String contactNumber;

    @Column(nullable = false)
    private Integer registeredBranchId;

    @Column(length = 255)
    private String digitalSignatureUrl;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
