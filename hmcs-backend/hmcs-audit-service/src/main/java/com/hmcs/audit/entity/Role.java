package com.hmcs.audit.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;

@Data
@Entity
@Table(name = "roles", schema = "auth_service")
public class Role {
    private Integer tenantId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roleId;

    @Column(nullable = false, unique = true, length = 50)
    private String roleName;

    @Column(columnDefinition = "TEXT")
    private String description;
}
