package com.hmcs.auth.controller;

import com.hmcs.auth.dto.BranchDTO;
import com.hmcs.auth.entity.Branch;
import com.hmcs.auth.repository.BranchRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth/branches")
public class BranchController {
    
    private final BranchRepository branchRepository;

    public BranchController(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    @GetMapping
    public ResponseEntity<List<BranchDTO>> getAllBranches() {
        System.out.println("DEBUG: TenantContext in BranchController is: " + com.hmcs.auth.multitenancy.TenantContext.getTenantId());
        List<BranchDTO> branches = branchRepository.findAll().stream().map(b -> {
            BranchDTO dto = new BranchDTO();
            dto.setBranchId(b.getBranchId());
            dto.setBranchName(b.getBranchName());
            dto.setLocation(b.getLocation());
            dto.setStatus(b.getStatus());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(branches);
    }

    @PostMapping
    public ResponseEntity<?> createBranch(@RequestBody BranchDTO dto) {
        if (branchRepository.findByBranchName(dto.getBranchName()).isPresent()) {
            return ResponseEntity.badRequest().body("Branch name already exists");
        }
        
        Branch branch = new Branch();
        branch.setBranchName(dto.getBranchName());
        branch.setLocation(dto.getLocation());
        branch.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        
        Branch saved = branchRepository.save(branch);
        dto.setBranchId(saved.getBranchId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBranch(@PathVariable Integer id, @RequestBody BranchDTO dto) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
                
        // Check if name is taken by another branch
        branchRepository.findByBranchName(dto.getBranchName())
                .ifPresent(existing -> {
                    if (!existing.getBranchId().equals(id)) {
                        throw new RuntimeException("Branch name already exists");
                    }
                });
                
        branch.setBranchName(dto.getBranchName());
        branch.setLocation(dto.getLocation());
        branch.setStatus(dto.getStatus());
        
        Branch saved = branchRepository.save(branch);
        dto.setBranchId(saved.getBranchId());
        return ResponseEntity.ok(dto);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateBranch(@PathVariable Integer id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        // Soft delete
        branch.setStatus("INACTIVE");
        branchRepository.save(branch);
        return ResponseEntity.ok().build();
    }
}
