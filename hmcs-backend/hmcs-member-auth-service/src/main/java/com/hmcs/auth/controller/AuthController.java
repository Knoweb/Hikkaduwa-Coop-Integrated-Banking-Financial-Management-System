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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final JwtUtil jwtUtil;
    private final EntityManager entityManager;

    public AuthController(UserRepository userRepo, RoleRepository roleRepo, BranchRepository branchRepo, JwtUtil jwtUtil, EntityManager entityManager) {
        this.userRepository = userRepo;
        this.roleRepository = roleRepo;
        this.branchRepository = branchRepo;
        this.jwtUtil = jwtUtil;
        this.entityManager = entityManager;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required");
        }

        try {
            // Find user globally across all tenants using native query to bypass Hibernate @TenantId
            java.util.List<Object[]> users = entityManager.createNativeQuery(
                "SELECT u.user_id, u.username, u.password_hash, u.tenant_id, r.role_name, b.branch_id, b.branch_name, o.name as organization_name " +
                "FROM auth_service.users u " +
                "JOIN auth_service.roles r ON u.role_id = r.role_id " +
                "LEFT JOIN auth_service.branches b ON u.branch_id = b.branch_id " +
                "LEFT JOIN auth_service.organizations o ON u.tenant_id = o.organization_id " +
                "WHERE u.username = :username AND u.status = 'ACTIVE'"
            ).setParameter("username", request.getUsername()).getResultList();

            if (users.isEmpty()) {
                System.out.println("Login Failed: users.isEmpty() for " + request.getUsername());
                return ResponseEntity.status(401).body("Invalid credentials or inactive user");
            }

            Object[] userRow = users.get(0);
            String dbPassword = (String) userRow[2];
            
            if (!dbPassword.equals(request.getPassword())) {
                System.out.println("Login Failed: password mismatch for " + request.getUsername() + ". DB: [" + dbPassword + "], Req: [" + request.getPassword() + "]");
                return ResponseEntity.status(401).body("Invalid credentials");
            }

            System.out.println("Login Success: " + request.getUsername());
            String username = (String) userRow[1];
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

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal server error during login");
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
        admin.setPasswordHash("Knoweb@099901"); 
        admin.setFullName("knowebsolutions@gmail.com");
        admin.setBranch(null); 
        admin.setRole(role);
        
        userRepository.save(admin);
        return ResponseEntity.ok("Admin user created successfully! Username: Knoweb, Password: Knoweb@099901");
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

    private void createIfNotExists(String username, String fullName, String password, Role role, Branch branch) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User u = new User();
            u.setUsername(username);
            u.setPasswordHash(password);
            u.setFullName(fullName);
            u.setRole(role);
            u.setBranch(branch);
            userRepository.save(u);
        }
    }
}
