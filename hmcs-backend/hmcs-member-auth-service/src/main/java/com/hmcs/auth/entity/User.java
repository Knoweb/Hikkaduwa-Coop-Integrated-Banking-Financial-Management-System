package com.hmcs.auth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "users", schema = "auth_service")
public class User {
    @TenantId
    private Integer tenantId;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(unique = true, length = 100)
    private String email;

    @Column(name = "mfa_type", length = 20)
    private String mfaType = "NONE";

    @Column(name = "totp_secret", length = 100)
    private String totpSecret;

    @Column(name = "active_token", length = 500)
    private String activeToken;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
