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

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth/users")
public class UserController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;

    public UserController(UserRepository userRepository, RoleRepository roleRepository, BranchRepository branchRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.branchRepository = branchRepository;
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
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserDTO dto) {
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
        user.setPasswordHash(dto.getPassword() != null ? dto.getPassword() : "password");
        user.setFullName(dto.getFullName());
        user.setRole(role);
        user.setBranch(branch);
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");

        User saved = userRepository.save(user);
        
        dto.setUserId(saved.getUserId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody UserDTO dto) {
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
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            user.setPasswordHash(dto.getPassword());
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
