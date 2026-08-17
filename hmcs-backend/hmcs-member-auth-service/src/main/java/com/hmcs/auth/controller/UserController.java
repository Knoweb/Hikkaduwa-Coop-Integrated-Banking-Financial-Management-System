package com.hmcs.auth.controller;

import com.hmcs.auth.dto.UserDTO;
import com.hmcs.auth.entity.Branch;
import com.hmcs.auth.entity.Role;
import com.hmcs.auth.entity.User;
import com.hmcs.auth.repository.BranchRepository;
import com.hmcs.auth.repository.RoleRepository;
import com.hmcs.auth.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;

@RestController
@RequestMapping("/api/v1/auth/users")
public class UserController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, RoleRepository roleRepository, BranchRepository branchRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream().map(u -> {
            UserDTO dto = new UserDTO();
            dto.setUserId(u.getUserId());
            dto.setUsername(u.getUsername());
            dto.setFullName(u.getFullName());
            dto.setRole(u.getRole().getRoleName());
            dto.setBranchId(u.getBranch() != null ? u.getBranch().getBranchId() : null);
            dto.setStatus(u.getStatus());
            dto.setEmail(u.getEmail());
            dto.setMfaType(u.getMfaType());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    private boolean isPasswordComplex(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else hasSpecial = true;
        }
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@jakarta.validation.Valid @RequestBody UserDTO dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found"));
        }
        Role role = roleRepository.findByRoleName(dto.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = new User();
        user.setUsername(dto.getUsername());
        
        String rawPassword = dto.getPassword() != null && !dto.getPassword().isEmpty() ? dto.getPassword() : "ChangeMe@123";
        if (dto.getPassword() != null && !dto.getPassword().isEmpty() && !isPasswordComplex(rawPassword)) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters long, and contain uppercase, lowercase, numbers, and special characters.");
        }
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        
        user.setFullName(dto.getFullName());
        user.setRole(role);
        user.setBranch(branch);
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        user.setEmail(dto.getEmail());
        user.setMfaType(dto.getMfaType() != null ? dto.getMfaType() : "NONE");

        if ("NONE".equals(user.getMfaType())) {
            user.setTotpSecret(null);
        }

        User saved = userRepository.save(user);
        
        dto.setUserId(saved.getUserId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @jakarta.validation.Valid @RequestBody UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found"));
        }
        Role role = roleRepository.findByRoleName(dto.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        user.setFullName(dto.getFullName());
        user.setRole(role);
        user.setBranch(branch);
        user.setStatus(dto.getStatus());
        user.setEmail(dto.getEmail());
        
        user.setMfaType(dto.getMfaType() != null ? dto.getMfaType() : "NONE");

        if ("NONE".equals(user.getMfaType())) {
            user.setTotpSecret(null); // Clear secret if MFA is disabled
        }

        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            if (!isPasswordComplex(dto.getPassword())) {
                return ResponseEntity.badRequest().body("Password must be at least 8 characters long, and contain uppercase, lowercase, numbers, and special characters.");
            }
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        User saved = userRepository.save(user);
        dto.setUserId(saved.getUserId());
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // GET /api/v1/auth/users/roles - Fetch all roles from DB dynamically
    @GetMapping("/roles")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAllRoles() {
        List<java.util.Map<String, Object>> roles = roleRepository.findAll().stream()
            .filter(r -> !r.getRoleName().equalsIgnoreCase("SYSTEM_ADMIN")) // exclude super-admin from assignment
            .map(r -> {
                java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                map.put("roleId", r.getRoleId());
                map.put("roleName", r.getRoleName());
                map.put("description", r.getDescription());
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }
}
