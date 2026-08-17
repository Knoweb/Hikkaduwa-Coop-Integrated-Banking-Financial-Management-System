package com.hmcs.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_audit_logs", schema = "audit_service")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false)
    private String eventType; // e.g., "LOGIN_SUCCESS", "LOGIN_FAILED", "USER_CREATED"

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address")
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;
}
