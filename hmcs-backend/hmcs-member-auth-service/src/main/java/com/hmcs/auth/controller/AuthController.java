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

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepo, RoleRepository roleRepo, BranchRepository branchRepo, JwtUtil jwtUtil) {
        this.userRepository = userRepo;
        this.roleRepository = roleRepo;
        this.branchRepository = branchRepo;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent() && userOpt.get().getPasswordHash().equals(request.getPassword())) {
            User user = userOpt.get();
            Integer branchId = user.getBranch() != null ? user.getBranch().getBranchId() : null;
            String branchName = user.getBranch() != null ? user.getBranch().getBranchName() : "System-wide";

            LoginResponse res = new LoginResponse();
            // branchId is embedded INSIDE the JWT — frontend cannot tamper with it
            res.setToken(jwtUtil.generateToken(user.getUsername(), user.getRole().getRoleName(), branchId));
            res.setUserId(user.getUserId());
            res.setUsername(user.getUsername());
            res.setRole(user.getRole().getRoleName());
            res.setBranchId(branchId);
            res.setBranchName(branchName);
            return ResponseEntity.ok(res);
        }
        return ResponseEntity.status(401).body("Invalid credentials");
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

        Role gmRole      = roleRepository.findByRoleName("GENERAL_MANAGER").orElseThrow();
        Role mgrRole     = roleRepository.findByRoleName("BRANCH_MANAGER").orElseThrow();
        Role tellerRole  = roleRepository.findByRoleName("TELLER").orElseThrow();
        Role valuerRole  = roleRepository.findByRoleName("VALUER").orElseThrow();
        Role fieldRole   = roleRepository.findByRoleName("FIELD_OFFICER").orElseThrow();
        Role soRole      = roleRepository.findByRoleName("SENIOR_OFFICER").orElseThrow();
        Role sysAdminRole = roleRepository.findByRoleName("SYSTEM_ADMIN").orElseThrow();

        createIfNotExists("Knoweb", "knowebsolutions@gmail.com", "Knoweb@099901", sysAdminRole, null);
        createIfNotExists("gm_perera",  "D.P. Perera",     "password", gmRole,     mainBranch);
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
                "GENERAL_MANAGER→ gm_perera  / password → /manager/dashboard",
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
