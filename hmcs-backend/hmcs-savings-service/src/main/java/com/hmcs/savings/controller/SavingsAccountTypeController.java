package com.hmcs.savings.controller;

import com.hmcs.savings.entity.SavingsAccountType;
import com.hmcs.savings.repository.SavingsAccountTypeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/savings/account-types")
public class SavingsAccountTypeController {

    private final SavingsAccountTypeRepository repository;
    private final com.hmcs.savings.repository.AccountRepository accountRepository;

    public SavingsAccountTypeController(SavingsAccountTypeRepository repository, com.hmcs.savings.repository.AccountRepository accountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
    }

    @GetMapping
    public ResponseEntity<List<SavingsAccountType>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<SavingsAccountType> create(@RequestBody SavingsAccountType type) {
        if (type.getCode() == null || type.getCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        type.setCode(type.getCode().toUpperCase().trim());
        
        // Prevent duplicates
        if (repository.findByCode(type.getCode()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(repository.save(type));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/rate")
    public ResponseEntity<SavingsAccountType> updateRate(@PathVariable Long id, @RequestBody java.util.Map<String, java.math.BigDecimal> body) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        SavingsAccountType type = repository.findById(id).get();
        if (body.containsKey("interestRate")) {
            java.math.BigDecimal newRate = body.get("interestRate");
            type.setInterestRate(newRate);
            
            // Cascade update to all existing accounts of this type
            String originalCode = type.getCode();
            String legacyCode = type.getCode().toLowerCase();
            if ("NORMAL".equalsIgnoreCase(originalCode) || "SAMANYA".equalsIgnoreCase(originalCode)) {
                legacyCode = "samanaya"; // Legacy mapping for old DB records
            }
            
            System.out.println("Updating rate for type: " + originalCode + " to " + newRate);
            
            List<com.hmcs.savings.entity.Account> existingAccounts = accountRepository.findAll();
            System.out.println("Found " + existingAccounts.size() + " total accounts for this tenant.");
            int updatedCount = 0;
            for (com.hmcs.savings.entity.Account acc : existingAccounts) {
                if (acc.getAccountType() != null && 
                   (acc.getAccountType().equalsIgnoreCase(originalCode) || 
                    acc.getAccountType().equalsIgnoreCase(legacyCode))) {
                    acc.setAnnualInterestRate(newRate);
                    accountRepository.save(acc);
                    updatedCount++;
                }
            }
            System.out.println("Successfully updated " + updatedCount + " accounts.");
        }
        return ResponseEntity.ok(repository.save(type));
    }
}
