package com.hmcs.auth.controller;

import com.hmcs.auth.dto.LoginRequest;
import com.hmcs.auth.dto.LoginResponse;
import com.hmcs.auth.entity.Branch;
import com.hmcs.auth.entity.Role;
import com.hmcs.auth.entity.User;
import com.hmcs.auth.repository.BranchRepository;
import com.hmcs.auth.repository.RoleRepository;
import com.hmcs.auth.repository.UserRepository;
import com.hmcs.auth.security.JwtUtil;
import com.hmcs.auth.entity.SystemAuditLog;
import com.hmcs.auth.repository.SystemAuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final JwtUtil jwtUtil;
    
    private static class OtpData {
        String code;
        java.time.LocalDateTime expiryTime;
        OtpData(String code, java.time.LocalDateTime expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }
    }
    private static final java.util.Map<String, OtpData> otpStore = new java.util.concurrent.ConcurrentHashMap<>();

    private final EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;
    private final SystemAuditLogRepository systemAuditLogRepository;

    @Autowired(required = false)
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    public AuthController(UserRepository userRepo, RoleRepository roleRepo, BranchRepository branchRepo, JwtUtil jwtUtil, EntityManager entityManager, PasswordEncoder passwordEncoder, SystemAuditLogRepository systemAuditLogRepository) {
        this.userRepository = userRepo;
        this.roleRepository = roleRepo;
        this.branchRepository = branchRepo;
        this.jwtUtil = jwtUtil;
        this.entityManager = entityManager;
        this.passwordEncoder = passwordEncoder;
        this.systemAuditLogRepository = systemAuditLogRepository;
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required");
        }

        try {
            // Find user globally across all tenants using native query
            java.util.List<Object[]> users = entityManager.createNativeQuery(
                "SELECT u.user_id, u.username, u.password_hash, u.tenant_id, r.role_name, b.branch_id, b.branch_name, o.name as organization_name, u.locked_until, u.failed_login_attempts, u.email, u.mfa_type, u.totp_secret " +
                "FROM auth_service.users u " +
                "JOIN auth_service.roles r ON u.role_id = r.role_id " +
                "LEFT JOIN auth_service.branches b ON u.branch_id = b.branch_id " +
                "LEFT JOIN auth_service.organizations o ON u.tenant_id = o.organization_id " +
                "WHERE u.username = :username AND u.status = 'ACTIVE'"
            ).setParameter("username", request.getUsername()).getResultList();

            if (users.isEmpty()) {
                System.out.println("Login Failed: users.isEmpty() for " + request.getUsername());
                systemAuditLogRepository.save(SystemAuditLog.builder()
                        .eventType("LOGIN_FAILED")
                        .username(request.getUsername())
                        .tenantId(1L)
                        .description("Invalid credentials or inactive user")
                        .build());
                return ResponseEntity.status(401).body("Invalid credentials or inactive user");
            }

            Object[] userRow = users.get(0);
            String dbPassword = (String) userRow[2];
            java.time.LocalDateTime lockedUntil = null;
            if (userRow[8] != null) {
                if (userRow[8] instanceof java.sql.Timestamp) {
                    lockedUntil = ((java.sql.Timestamp) userRow[8]).toLocalDateTime();
                } else if (userRow[8] instanceof java.time.LocalDateTime) {
                    lockedUntil = (java.time.LocalDateTime) userRow[8];
                }
            }
            int failedAttempts = userRow[9] != null ? ((Number) userRow[9]).intValue() : 0;

            if (lockedUntil != null && lockedUntil.isAfter(java.time.LocalDateTime.now())) {
                long remainingSeconds = java.time.Duration.between(java.time.LocalDateTime.now(), lockedUntil).getSeconds();
                systemAuditLogRepository.save(SystemAuditLog.builder()
                        .eventType("LOGIN_FAILED")
                        .username(request.getUsername())
                        .tenantId(userRow[3] != null ? ((Number) userRow[3]).longValue() : 1L)
                        .branchId(userRow[5] != null ? ((Number) userRow[5]).longValue() : null)
                        .description("Account locked. Remaining seconds: " + remainingSeconds)
                        .build());
                return ResponseEntity.status(401).body(java.util.Map.of(
                    "message", "Account is temporarily locked. Please try again later.",
                    "lockoutRemainingSeconds", remainingSeconds
                ));
            }

            boolean passwordMatch = false;
            if (dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$")) {
                passwordMatch = passwordEncoder.matches(request.getPassword(), dbPassword);
            } else {
                passwordMatch = dbPassword.equals(request.getPassword());
                if (passwordMatch) {
                    String newHash = passwordEncoder.encode(request.getPassword());
                    entityManager.createNativeQuery("UPDATE auth_service.users SET password_hash = :hash WHERE username = :uname")
                                 .setParameter("hash", newHash)
                                 .setParameter("uname", request.getUsername())
                                 .executeUpdate();
                }
            }
            
            if (!passwordMatch) {
                failedAttempts++;
                String updateQuery = "UPDATE auth_service.users SET failed_login_attempts = :attempts";
                if (failedAttempts >= 5) {
                    updateQuery += ", locked_until = :lockTime";
                }
                updateQuery += " WHERE username = :uname";

                var query = entityManager.createNativeQuery(updateQuery)
                             .setParameter("attempts", failedAttempts)
                             .setParameter("uname", request.getUsername());
                if (failedAttempts >= 5) {
                    query.setParameter("lockTime", java.time.LocalDateTime.now().plusMinutes(5));
                }
                query.executeUpdate();

                System.out.println("Login Failed: password mismatch for " + request.getUsername() + " (Attempt " + failedAttempts + ")");
                systemAuditLogRepository.save(SystemAuditLog.builder()
                        .eventType("LOGIN_FAILED")
                        .username(request.getUsername())
                        .tenantId(userRow[3] != null ? ((Number) userRow[3]).longValue() : 1L)
                        .branchId(userRow[5] != null ? ((Number) userRow[5]).longValue() : null)
                        .description("Password mismatch (Attempt " + failedAttempts + ")")
                        .build());
                return ResponseEntity.status(401).body("Invalid credentials");
            }

            // Reset failed attempts on success
            if (failedAttempts > 0 || lockedUntil != null) {
                entityManager.createNativeQuery("UPDATE auth_service.users SET failed_login_attempts = 0, locked_until = NULL WHERE username = :uname")
                             .setParameter("uname", request.getUsername())
                             .executeUpdate();
            }

            System.out.println("Login Success: " + request.getUsername());
            String username = (String) userRow[1];
            Integer tenantId = userRow[3] != null ? ((Number) userRow[3]).intValue() : null;
            String roleName = (String) userRow[4];
            Integer branchId = userRow[5] != null ? ((Number) userRow[5]).intValue() : null;
            String branchName = userRow[6] != null ? (String) userRow[6] : "System-wide";
            String orgName = userRow[7] != null ? (String) userRow[7] : "HMCS Platform";
            
            String email = userRow.length > 10 && userRow[10] != null ? (String) userRow[10] : null;
            String mfaType = userRow.length > 11 && userRow[11] != null ? (String) userRow[11] : "NONE";
            String totpSecret = userRow.length > 12 && userRow[12] != null ? (String) userRow[12] : null;

            if ("ENABLED".equals(mfaType) || "PENDING_SETUP".equals(mfaType) || "EMAIL".equals(mfaType) || "TOTP".equals(mfaType)) {
                // If MFA is required at all, let the user choose their method
                LoginResponse res = new LoginResponse();
                res.setRequireOtp(true);
                res.setTempToken(request.getUsername());
                res.setMfaType("CHOOSE_METHOD");
                return ResponseEntity.ok(res);
            }
            String token = jwtUtil.generateToken(username, roleName, branchId, tenantId);
            
            // Set active token
            entityManager.createNativeQuery("UPDATE auth_service.users SET active_token = :token WHERE username = :uname")
                         .setParameter("token", token)
                         .setParameter("uname", username)
                         .executeUpdate();

            systemAuditLogRepository.save(SystemAuditLog.builder()
                    .eventType("LOGIN_SUCCESS")
                    .username(username)
                    .tenantId(tenantId != null ? tenantId.longValue() : null)
                    .branchId(branchId != null ? branchId.longValue() : null)
                    .description("User logged in successfully")
                    .build());

            ResponseCookie cookie = ResponseCookie.from("jwt_token", token)
                    .httpOnly(true)
                    .secure(false) // Use false for localhost
                    .path("/")
                    .maxAge(24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            LoginResponse res = new LoginResponse();
            res.setUserId(userRow[0] != null ? java.util.UUID.fromString(userRow[0].toString()) : null);
            res.setToken(token);
            res.setUsername(username);
            res.setRole(roleName);
            res.setBranchId(branchId);
            res.setBranchName(branchName);
            res.setTenantId(tenantId);
            res.setOrganizationName(orgName);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(res);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal server error during login");
        }
    }
    @PostMapping("/setup-mfa")
    @Transactional
    public ResponseEntity<?> requestMfa(@RequestBody java.util.Map<String, String> request) {
        String username = request.get("tempToken");
        String method = request.get("method"); // "TOTP" or "EMAIL"
        
        java.util.List<Object[]> users = entityManager.createNativeQuery(
            "SELECT u.user_id, u.email, u.mfa_type, u.totp_secret FROM auth_service.users u WHERE u.username = :uname AND u.status = 'ACTIVE'")
            .setParameter("uname", username)
            .getResultList();

        if (users.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid token");
        }
        
        Object[] userRow = users.get(0);
        String email = userRow[1] != null ? (String) userRow[1] : null;
        String mfaType = userRow[2] != null ? (String) userRow[2] : "NONE";
        String totpSecret = userRow[3] != null ? (String) userRow[3] : null;

        if ("NONE".equals(mfaType)) {
            return ResponseEntity.badRequest().body("MFA is not enabled for this user.");
        }
        
        // Ensure mfaType is set to ENABLED (upgrade legacy TOTP/EMAIL strings)
        if (!"ENABLED".equals(mfaType)) {
            entityManager.createNativeQuery("UPDATE auth_service.users SET mfa_type = 'ENABLED' WHERE username = :uname")
                .setParameter("uname", username)
                .executeUpdate();
        }
        
        if ("TOTP".equals(method)) {
            if (totpSecret == null) {
                // Needs setup
                dev.samstevens.totp.secret.SecretGenerator secretGenerator = new dev.samstevens.totp.secret.DefaultSecretGenerator();
                String secret = secretGenerator.generate();
                
                entityManager.createNativeQuery("UPDATE auth_service.users SET totp_secret = :secret WHERE username = :uname")
                    .setParameter("secret", secret)
                    .setParameter("uname", username)
                    .executeUpdate();
                
                System.out.println("=================================================");
                System.out.println("User Setup NEW TOTP Secret for " + username + ": " + secret);
                System.out.println("=================================================");
                
                java.util.Map<String, String> res = new java.util.HashMap<>();
                res.put("totpSecret", secret);
                res.put("status", "SETUP_REQUIRED");
                return ResponseEntity.ok(res);
            } else {
                // Already setup, just prompt for code
                return ResponseEntity.ok(java.util.Collections.singletonMap("status", "READY"));
            }
            
        } else if ("EMAIL".equals(method)) {
            // Generate and send OTP for verification immediately
            String otp = String.format("%06d", new java.util.Random().nextInt(999999));
            otpStore.put(username, new OtpData(otp, java.time.LocalDateTime.now().plusMinutes(5)));
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.status(400).body(java.util.Collections.singletonMap("message", "No registered email address found for this account."));
            }

            if (mailSender != null) {
                try {
                    org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                    message.setTo(email);
                    message.setSubject("Your HMCS Login OTP");
                    message.setText("Your One-Time Password for HMCS login is: " + otp + "\n\nThis OTP will expire in 5 minutes.");
                    mailSender.send(message);
                } catch (Exception e) {
                    System.err.println("Failed to send OTP email: " + e.getMessage());
                    return ResponseEntity.status(500).body(java.util.Collections.singletonMap("message", "Failed to send OTP to your email address."));
                }
            } else {
                System.out.println("=================================================");
                System.out.println("EMAIL OTP for " + username + ": " + otp);
                System.out.println("=================================================");
            }
            
            return ResponseEntity.ok(java.util.Collections.singletonMap("status", "EMAIL_SENT"));
        }
        
        return ResponseEntity.badRequest().body("Invalid MFA method requested.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> payload) {
        String username = payload.get("username");
        if (username == null || username.isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required");
        }
        
        // Simulate sending a reset link to the registered email
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = java.util.UUID.randomUUID().toString();
            if (mailSender != null && user.getEmail() != null && !user.getEmail().isEmpty()) {
                try {
                    org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                    message.setTo(user.getEmail());
                    message.setSubject("HMCS Password Reset Request");
                    message.setText("Click the following link to reset your password:\nhttp://localhost:5173/reset-password?token=" + token);
                    mailSender.send(message);
                    System.out.println("Password reset email sent to " + user.getEmail());
                } catch (Exception e) {
                    System.err.println("Failed to send reset email: " + e.getMessage());
                    System.out.println("======================================================");
                    System.out.println("FALLBACK PASSWORD RESET LINK FOR USER: " + username);
                    System.out.println("http://localhost:5173/reset-password?token=" + token);
                    System.out.println("======================================================");
                }
            } else {
                System.out.println("======================================================");
                System.out.println("PASSWORD RESET LINK FOR USER: " + username);
                System.out.println("http://localhost:5173/reset-password?token=" + token);
                System.out.println("======================================================");
            }
            return ResponseEntity.ok("Password reset link sent to your email.");
        } else {
            return ResponseEntity.status(404).body("Username not found.");
        }
    }

    @PostMapping("/verify-otp")
    @Transactional
    public ResponseEntity<?> verifyOtp(@RequestBody com.hmcs.auth.dto.VerifyOtpRequest request) {
        String username = request.getTempToken();
        
        try {
            java.util.List<Object[]> users = entityManager.createNativeQuery(
                "SELECT u.user_id, u.username, u.password_hash, u.tenant_id, r.role_name, b.branch_id, b.branch_name, o.name as organization_name, u.email, u.mfa_type, u.totp_secret " +
                "FROM auth_service.users u JOIN auth_service.roles r ON u.role_id = r.role_id LEFT JOIN auth_service.branches b ON u.branch_id = b.branch_id LEFT JOIN auth_service.organizations o ON u.tenant_id = o.organization_id WHERE u.username = :uname AND u.status = 'ACTIVE'")
                .setParameter("uname", username)
                .getResultList();
                
            if (users.isEmpty()) {
                return ResponseEntity.status(401).body("User not found after OTP");
            }
            
            Object[] userRow = users.get(0);
            String mfaType = userRow.length > 9 && userRow[9] != null ? (String) userRow[9] : "NONE";
            String totpSecret = userRow.length > 10 && userRow[10] != null ? (String) userRow[10] : null;

            boolean validOtp = false;
            
            if ("EMAIL".equals(mfaType) || "ENABLED".equals(mfaType)) {
                OtpData expectedOtp = otpStore.get(username);
                if (expectedOtp != null && expectedOtp.code.equals(request.getOtp())) {
                    if (expectedOtp.expiryTime.isAfter(java.time.LocalDateTime.now())) {
                        validOtp = true;
                        otpStore.remove(username);
                    } else {
                        otpStore.remove(username); // Expired
                    }
                }
            }
            
            if (!validOtp && ("TOTP".equals(mfaType) || "ENABLED".equals(mfaType))) {
                if (totpSecret != null) {
                    dev.samstevens.totp.code.CodeVerifier verifier = new dev.samstevens.totp.code.DefaultCodeVerifier(new dev.samstevens.totp.code.DefaultCodeGenerator(), new dev.samstevens.totp.time.SystemTimeProvider());
                    if (verifier.isValidCode(totpSecret, request.getOtp())) {
                        validOtp = true;
                    }
                }
            }

            if (!validOtp) {
                return ResponseEntity.status(401).body("Invalid or expired code");
            }

            Integer tenantId = userRow[3] != null ? ((Number) userRow[3]).intValue() : null;
            String roleName = (String) userRow[4];
            Integer branchId = userRow[5] != null ? ((Number) userRow[5]).intValue() : null;
            String branchName = userRow[6] != null ? (String) userRow[6] : "System-wide";
            String orgName = userRow[7] != null ? (String) userRow[7] : "HMCS Platform";

            LoginResponse res = new LoginResponse();
            res.setToken(jwtUtil.generateToken(username, roleName, branchId, tenantId));
            res.setUserId(userRow[0] != null ? java.util.UUID.fromString(userRow[0].toString()) : null);
            res.setUsername(username);
            res.setRole(roleName);
            res.setBranchId(branchId);
            res.setBranchName(branchName);
            res.setTenantId(tenantId);
            res.setOrganizationName(orgName);
            return ResponseEntity.ok(res);
        } catch(Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error generating token");
        }
    }

    @PostMapping("/seed-admin")
    public ResponseEntity<?> seedAdmin() {
        if(userRepository.findByUsername("Knoweb").isPresent()) {
            return ResponseEntity.ok("Admin user is already seeded!");
        }
        
        // Fetch seed data created by db_setup.sql
        Role role = roleRepository.findByRoleName("SYSTEM_ADMIN").orElseThrow();
        
        User admin = new User();
        admin.setUsername("Knoweb");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setFullName("Platform Admin");
        admin.setBranch(null); 
        admin.setRole(role);
        
        userRepository.save(admin);
        return ResponseEntity.ok("Admin user created successfully! Username: Knoweb, Password: admin123");
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken() {
        // If it reaches here, JwtAuthenticationFilter has already verified the token is the active_token
        return ResponseEntity.ok().build();
    }

    @PostMapping("/seed-all")
    public ResponseEntity<?> seedAllTestUsers() {
        Branch mainBranch = branchRepository.findByBranchName("Main Branch - Hikkaduwa").orElseThrow();
        Branch dodBranch  = branchRepository.findByBranchName("Dodanduwa Branch").orElseThrow();


        Role mgrRole     = roleRepository.findByRoleName("BRANCH_MANAGER").orElseThrow();
        Role tellerRole  = roleRepository.findByRoleName("TELLER").orElseThrow();
        Role valuerRole  = roleRepository.findByRoleName("VALUER").orElseThrow();
        Role fieldRole   = roleRepository.findByRoleName("FIELD_OFFICER").orElseThrow();
        Role soRole      = roleRepository.findByRoleName("SENIOR_OFFICER").orElseThrow();
        Role sysAdminRole = roleRepository.findByRoleName("SYSTEM_ADMIN").orElseGet(() -> { Role r = new Role(); r.setRoleName("SYSTEM_ADMIN"); r.setDescription("Super admin"); r.setTenantId(0); return roleRepository.save(r); });
        Role auditorRole = roleRepository.findByRoleName("AUDITOR").orElseGet(() -> { Role r = new Role(); r.setRoleName("AUDITOR"); r.setDescription("Internal Auditor"); r.setTenantId(1); return roleRepository.save(r); });

        createIfNotExists("Knoweb", "knowebsolutions@gmail.com", "Knoweb@099901", sysAdminRole, null);
        createIfNotExists("mgr_hkw",    "R.M. Silva",      "password", mgrRole,    mainBranch);
        createIfNotExists("mgr_dod",    "S.M. Fernando",   "password", mgrRole,    dodBranch);
        createIfNotExists("teller_hkw", "K.D. Jayasinghe", "password", tellerRole, mainBranch);
        createIfNotExists("senior_hkw", "L.M. Silva",      "password", soRole,     mainBranch);
        createIfNotExists("field_hkw",  "P.K. Saman",      "password", fieldRole,  mainBranch);
        createIfNotExists("valuer_hkw", "A.B. Bandara",    "password", valuerRole, mainBranch);

        return ResponseEntity.ok(java.util.Map.of(
            "message", "All test users seeded!",
            "logins", java.util.List.of(
                "SYSTEM_ADMIN   → admin      / password → /dashboard",

                "BRANCH_MANAGER → mgr_hkw    / password → /branch/dashboard  (Hikkaduwa)",
                "BRANCH_MANAGER → mgr_dod    / password → /branch/dashboard  (Dodanduwa)",
                "TELLER         → teller_hkw / password → /teller/dashboard",
                "SENIOR_OFFICER → senior_hkw / password → /cs/dashboard",
                "FIELD_OFFICER  → field_hkw  / password → /field/dashboard",
                "VALUER         → valuer_hkw / password → /valuer/dashboard"
            )
        ));
    }

    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest request) {
        String token = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("jwt_token".equals(c.getName())) {
                    token = c.getValue();
                }
            }
        }
        
        if (token != null) {
            try {
                String username = jwtUtil.extractUsername(token);
                
                Integer extractedTenant = jwtUtil.extractTenantId(token);
                Integer extractedBranch = jwtUtil.extractBranchId(token);
                
                Long tenantId = extractedTenant != null ? extractedTenant.longValue() : null;
                Long branchId = extractedBranch != null ? extractedBranch.longValue() : null;

                entityManager.createNativeQuery("UPDATE auth_service.users SET active_token = NULL WHERE username = :uname")
                             .setParameter("uname", username)
                             .executeUpdate();
                
                systemAuditLogRepository.save(SystemAuditLog.builder()
                        .eventType("LOGOUT")
                        .username(username)
                        .tenantId(tenantId)
                        .branchId(branchId)
                        .description("User logged out explicitly")
                        .build());
            } catch (Exception e) {
                // Ignore invalid token
            }
        }

        ResponseCookie cookie = ResponseCookie.from("jwt_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(java.util.Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/system-logs")
    public ResponseEntity<?> getSystemLogs(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long tenantId = 1L; // Default
        if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
            tenantId = Long.parseLong(tenantIdHeader);
        }
        
        java.util.List<SystemAuditLog> logs;
        if (tenantId == 0L) {
            logs = systemAuditLogRepository.findAllByOrderByTimestampDesc();
        } else {
            logs = systemAuditLogRepository.findByTenantIdOrderByTimestampDesc(tenantId);
        }
        
        return ResponseEntity.ok(logs);
    }

    private void createIfNotExists(String username, String fullName, String password, Role role, Branch branch) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User u = new User();
            u.setUsername(username);
            u.setPasswordHash(passwordEncoder.encode(password));
            u.setFullName(fullName);
            u.setRole(role);
            u.setBranch(branch);
            userRepository.save(u);
        }
    }
}
