package com.hmcs.audit.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;

@Data
@Entity
@Table(name = "branches", schema = "auth_service")
public class Branch {
    @Column(name = "tenant_id")
    private Integer tenantId;

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
