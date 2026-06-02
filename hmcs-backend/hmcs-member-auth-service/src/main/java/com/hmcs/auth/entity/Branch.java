package com.hmcs.auth.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "branches", schema = "auth_service")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer branchId;

    @Column(nullable = false, unique = true, length = 100)
    private String branchName;

    @Column(length = 255)
    private String location;

    @Column(length = 20)
    private String status = "ACTIVE";
}
