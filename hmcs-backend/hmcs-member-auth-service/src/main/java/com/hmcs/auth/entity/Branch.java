package com.hmcs.auth.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "branches")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "branch_id")
    private Integer branchId;

    @Column(name = "branch_name", nullable = false, unique = true)
    private String branchName;

    @Column(name = "location")
    private String location;

    @Column(name = "status")
    private String status;
}
