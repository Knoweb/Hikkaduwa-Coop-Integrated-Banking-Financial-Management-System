package com.hmcs.loan.controller;

import com.hmcs.loan.entity.LoanType;
import com.hmcs.loan.service.LoanTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loans/types")
public class LoanTypeController {

    @Autowired
    private LoanTypeService loanTypeService;

    @GetMapping
    public List<LoanType> getAllLoanTypes(@RequestParam(required = false, defaultValue = "true") boolean activeOnly) {
        if (activeOnly) {
            return loanTypeService.getAllActiveLoanTypes();
        }
        return loanTypeService.getAllLoanTypes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanType> getLoanTypeById(@PathVariable UUID id) {
        return loanTypeService.getLoanTypeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public LoanType createLoanType(@RequestBody LoanType loanType) {
        return loanTypeService.createLoanType(loanType);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LoanType> updateLoanType(@PathVariable UUID id, @RequestBody LoanType loanTypeDetails) {
        try {
            LoanType updated = loanTypeService.updateLoanType(id, loanTypeDetails);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLoanType(@PathVariable UUID id) {
        loanTypeService.deleteLoanType(id);
        return ResponseEntity.ok().build();
    }
}
