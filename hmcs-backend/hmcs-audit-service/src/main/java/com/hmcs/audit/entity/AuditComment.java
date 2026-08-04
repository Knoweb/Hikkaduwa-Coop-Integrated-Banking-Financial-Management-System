package com.hmcs.audit.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import org.hibernate.annotations.TenantId;

@Data
@Entity
@Table(name = "audit_comments", schema = "audit_service")
public class AuditComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String auditorUsername;

    @Column(nullable = false)
    private String auditorName;

    @Column(nullable = false, length = 1000)
    private String comment;

    @Column(name = "tenant_id", nullable = false)
    private Integer tenantId;

    @Column(name="branch_id")
    private Integer branchId;

    @Column(nullable = false)
    private String status = "UNREAD"; // UNREAD or READ

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column
    private LocalDateTime readAt;
    
    @Column
    private String readBy;
}
