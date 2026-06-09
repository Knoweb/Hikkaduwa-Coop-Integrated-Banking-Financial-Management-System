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

    public SavingsAccountTypeController(SavingsAccountTypeRepository repository) {
        this.repository = repository;
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
}
