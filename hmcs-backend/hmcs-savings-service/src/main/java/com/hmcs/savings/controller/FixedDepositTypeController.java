package com.hmcs.savings.controller;

import com.hmcs.savings.entity.FixedDepositType;
import com.hmcs.savings.repository.FixedDepositTypeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/fixed-deposit-types")
public class FixedDepositTypeController {

    private final FixedDepositTypeRepository repository;

    public FixedDepositTypeController(FixedDepositTypeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<FixedDepositType>> getActiveTypes() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<FixedDepositType> createType(@RequestBody FixedDepositType type) {
        if (type.getInterestRateMonthly() == null && type.getInterestRateMaturity() != null) {
            type.setInterestRateMonthly(type.getInterestRateMaturity().subtract(new java.math.BigDecimal("2.0")));
        }
        return ResponseEntity.ok(repository.save(type));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FixedDepositType> updateType(@PathVariable UUID id, @RequestBody FixedDepositType typeDetails) {
        return repository.findById(id).map(type -> {
            type.setName(typeDetails.getName());
            type.setCode(typeDetails.getCode());
            type.setTermMonths(typeDetails.getTermMonths());
            type.setInterestRateMaturity(typeDetails.getInterestRateMaturity());
            type.setInterestRateMonthly(typeDetails.getInterestRateMonthly());
            type.setIsSeniorCitizen(typeDetails.getIsSeniorCitizen());
            type.setIsActive(typeDetails.getIsActive());
            return ResponseEntity.ok(repository.save(type));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteType(@PathVariable UUID id) {
        return repository.findById(id).map(type -> {
            repository.delete(type);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
