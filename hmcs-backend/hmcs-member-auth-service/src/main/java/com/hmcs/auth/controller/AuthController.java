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
            LoginResponse res = new LoginResponse();
            res.setToken(jwtUtil.generateToken(user.getUsername(), user.getRole().getRoleName()));
            res.setUsername(user.getUsername());
            res.setRole(user.getRole().getRoleName());
            return ResponseEntity.ok(res);
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/seed-admin")
    public ResponseEntity<?> seedAdmin() {
        if(userRepository.findByUsername("admin").isPresent()) {
            return ResponseEntity.ok("Admin user is already seeded!");
        }
        
        // Fetch seed data created by db_setup.sql
        Branch branch = branchRepository.findByBranchName("Main Branch - Hikkaduwa").orElseThrow();
        Role role = roleRepository.findByRoleName("SYSTEM_ADMIN").orElseThrow();
        
        User admin = new User();
        admin.setUsername("admin");
        admin.setPasswordHash("password"); // Development MVP plain text
        admin.setFullName("System Administrator");
        admin.setBranch(branch);
        admin.setRole(role);
        
        userRepository.save(admin);
        return ResponseEntity.ok("Admin user created successfully! Username: admin, Password: password");
    }
}
