package com.hmcs.savings.controller;

import com.hmcs.savings.entity.FixedDeposit;
import com.hmcs.savings.entity.FixedDepositType;
import com.hmcs.savings.repository.FixedDepositRepository;
import com.hmcs.savings.repository.FixedDepositTypeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/fixed-deposits")
public class FixedDepositController {

    private final FixedDepositRepository fdRepository;
    private final FixedDepositTypeRepository typeRepository;

    public FixedDepositController(FixedDepositRepository fdRepository, FixedDepositTypeRepository typeRepository) {
        this.fdRepository = fdRepository;
        this.typeRepository = typeRepository;
    }

    @GetMapping
    public ResponseEntity<List<FixedDeposit>> getAllFDs() {
        return ResponseEntity.ok(fdRepository.findAll());
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<FixedDeposit>> getMemberFDs(@PathVariable UUID memberId) {
        return ResponseEntity.ok(fdRepository.findByMemberId(memberId));
    }

    public static class OpenFdRequest {
        public UUID memberId;
        public UUID typeId;
        public BigDecimal principalAmount;
        public UUID linkedSavingsAccountId;
        public String interestPayoutMethod; // "MONTHLY" or "AT_MATURITY"
        public String maturityInstruction; // "REINVEST_PRINCIPAL_AND_INTEREST", "REINVEST_PRINCIPAL_PAY_INTEREST", "CLOSE_ACCOUNT"
    }

    @PostMapping
    public ResponseEntity<?> openFixedDeposit(@RequestBody OpenFdRequest request) {
        if (request.memberId == null || request.typeId == null || request.principalAmount == null) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        Optional<FixedDepositType> typeOpt = typeRepository.findById(request.typeId);
        if (typeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid FD Type");
        }
        FixedDepositType type = typeOpt.get();

        FixedDeposit fd = new FixedDeposit();
        fd.setMemberId(request.memberId);
        fd.setFdNumber("FD-" + (100000 + new Random().nextInt(900000)));
        fd.setPrincipalAmount(request.principalAmount);
        fd.setTermMonths(type.getTermMonths());
        fd.setMaturityDate(LocalDate.now().plusMonths(type.getTermMonths()));
        
        String payoutMethod = request.interestPayoutMethod != null ? request.interestPayoutMethod : "AT_MATURITY";
        fd.setInterestPayoutMethod(payoutMethod);

        if (request.maturityInstruction != null) {
            fd.setMaturityInstruction(request.maturityInstruction);
        } else {
            fd.setMaturityInstruction("REINVEST_PRINCIPAL_AND_INTEREST");
        }

        if ("MONTHLY".equals(payoutMethod)) {
            fd.setInterestRate(type.getInterestRateMonthly());
        } else {
            fd.setInterestRate(type.getInterestRateMaturity());
        }

        fd.setLinkedSavingsAccountId(request.linkedSavingsAccountId);
        fd.setStatus("ACTIVE");

        FixedDeposit savedFd = fdRepository.save(fd);
        return ResponseEntity.ok(savedFd);
    }
}
