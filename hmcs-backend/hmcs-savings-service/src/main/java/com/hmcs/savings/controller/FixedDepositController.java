package com.hmcs.savings.controller;

import com.hmcs.savings.entity.FixedDeposit;
import com.hmcs.savings.entity.FixedDepositType;
import com.hmcs.savings.repository.FixedDepositRepository;
import com.hmcs.savings.repository.FixedDepositTypeRepository;
import com.hmcs.savings.repository.FixedDepositRenewalRepository;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.TransactionRepository;
import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.entity.FixedDepositRenewal;
import com.hmcs.savings.security.BranchContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/fixed-deposits")
public class FixedDepositController {

    private final FixedDepositRepository fdRepository;
    private final FixedDepositTypeRepository typeRepository;
    private final FixedDepositRenewalRepository renewalRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BranchContext branchContext;
    private final com.hmcs.savings.service.FixedDepositInterestService interestService;

    public FixedDepositController(FixedDepositRepository fdRepository, FixedDepositTypeRepository typeRepository, FixedDepositRenewalRepository renewalRepository, AccountRepository accountRepository, TransactionRepository transactionRepository, BranchContext branchContext, @org.springframework.context.annotation.Lazy com.hmcs.savings.service.FixedDepositInterestService interestService) {
        this.fdRepository = fdRepository;
        this.typeRepository = typeRepository;
        this.renewalRepository = renewalRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.branchContext = branchContext;
        this.interestService = interestService;
    }

    @GetMapping
    public ResponseEntity<List<FixedDeposit>> getAllFDs(
            @RequestParam(required = false, defaultValue = "false") boolean branchOnly,
            HttpServletRequest request) {
        
        List<FixedDeposit> fds;
        if (branchOnly) {
            Integer branchId = branchContext.extractBranchId(request);
            fds = fdRepository.findAll().stream()
                    .filter(fd -> branchId == null || branchId.equals(fd.getBranchId()))
                    .collect(Collectors.toList());
        } else {
            fds = fdRepository.findAll();
        }
        return ResponseEntity.ok(fds);
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<FixedDeposit>> getMemberFDs(@PathVariable UUID memberId) {
        return ResponseEntity.ok(fdRepository.findByMemberId(memberId));
    }

    public static class OpenFdRequest {
        public UUID memberId;
        public UUID memberId2;
        public UUID memberId3;
        public UUID typeId;
        public String fdNumber;
        public BigDecimal principalAmount;
        public LocalDate openedDate;
        public UUID linkedSavingsAccountId;
        public String interestPayoutMethod; // "MONTHLY" or "AT_MATURITY"
        public String maturityInstruction; // "REINVEST_PRINCIPAL_AND_INTEREST", "REINVEST_PRINCIPAL_PAY_INTEREST", "CLOSE_ACCOUNT"
        public String receiptNumber;
        public Boolean isOfficerApproved;
        public String depositorSignature;
        public Boolean hasSubmittedTaxForm;
    }

    @PostMapping
    public ResponseEntity<?> openFixedDeposit(@RequestBody OpenFdRequest request, HttpServletRequest httpRequest) {
        if (request.memberId == null || request.typeId == null || request.principalAmount == null) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        Integer currentBranchId = branchContext.extractBranchId(httpRequest);
        if (currentBranchId == null) currentBranchId = 1;

        FixedDepositType type = typeRepository.findById(request.typeId).orElse(null);
        if (type == null) {
            return ResponseEntity.badRequest().body("Invalid FD Type");
        }

        FixedDeposit fd = new FixedDeposit();
        fd.setMemberId(request.memberId);
        fd.setMemberId2(request.memberId2);
        fd.setMemberId3(request.memberId3);
        fd.setTypeId(type.getId());
        if (request.fdNumber != null && !request.fdNumber.trim().isEmpty()) {
            fd.setFdNumber(request.fdNumber.trim());
        } else {
            fd.setFdNumber("FD-" + (100000 + new Random().nextInt(900000)));
        }
        fd.setPrincipalAmount(request.principalAmount);
        
        if (request.interestPayoutMethod != null && request.interestPayoutMethod.equals("MONTHLY")) {
            fd.setInterestRate(type.getInterestRateMonthly());
        } else {
            fd.setInterestRate(type.getInterestRateMaturity());
        }
        
        fd.setBranchId(currentBranchId);
        fd.setTermMonths(type.getTermMonths());
        if (request.openedDate != null) {
            fd.setOpenedDate(request.openedDate);
        } else {
            fd.setOpenedDate(LocalDate.now());
        }
        fd.setLastInterestPayoutDate(fd.getOpenedDate());
        fd.setAccumulatedInterest(BigDecimal.ZERO);
        fd.setMaturityDate(fd.getOpenedDate().plusMonths(type.getTermMonths()));
        
        String payoutMethod = request.interestPayoutMethod != null ? request.interestPayoutMethod : "AT_MATURITY";
        fd.setInterestPayoutMethod(payoutMethod);

        if (request.hasSubmittedTaxForm != null) {
            fd.setHasSubmittedTaxForm(request.hasSubmittedTaxForm);
        } else {
            fd.setHasSubmittedTaxForm(false);
        }

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
        if (request.receiptNumber != null) {
            fd.setReceiptNumber(request.receiptNumber);
        }

        if (request.isOfficerApproved != null) {
            fd.setIsOfficerApproved(request.isOfficerApproved);
        }
        
        if (request.depositorSignature != null) {
            fd.setDepositorSignature(request.depositorSignature);
        }

        fd.setStatus("ACTIVE");

        FixedDeposit savedFd = fdRepository.save(fd);
        
        // Catch up interest if it's a backdated FD
        if (savedFd.getOpenedDate().isBefore(LocalDate.now())) {
            try {
                interestService.catchUpSingleFD(savedFd);
                // Reload from DB to get updated accumulated interest and last payout date
                savedFd = fdRepository.findById(savedFd.getFdId()).orElse(savedFd);
            } catch (Exception e) {
                System.err.println("Failed to catch up interest for backdated FD: " + e.getMessage());
            }
        }
        
        return ResponseEntity.ok(savedFd);
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<?> releaseFixedDeposit(@PathVariable UUID id, @RequestParam(required = false) UUID targetAccountId, HttpServletRequest request) {
        Optional<FixedDeposit> fdOpt = fdRepository.findById(id);
        if (fdOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Fixed Deposit not found");
        }
        
        FixedDeposit fd = fdOpt.get();
        if ("CLOSED".equals(fd.getStatus())) {
            return ResponseEntity.badRequest().body("Fixed Deposit is already closed");
        }

        UUID accountToCredit = targetAccountId != null ? targetAccountId : fd.getLinkedSavingsAccountId();

        if (accountToCredit == null) {
            return ResponseEntity.badRequest().body("No linked savings account found for this Fixed Deposit");
        }

        Optional<Account> accOpt = accountRepository.findById(accountToCredit);
        if (accOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Linked savings account not found");
        }
        Account savingsAcc = accOpt.get();

        LocalDate today = LocalDate.now();
        boolean isMaturityDay = fd.getMaturityDate() != null && !today.isBefore(fd.getMaturityDate());
        
        BigDecimal principal = fd.getPrincipalAmount();
        BigDecimal netAmountToCredit = BigDecimal.ZERO;
        BigDecimal paidInterestToDeduct = BigDecimal.ZERO;
        
        if (isMaturityDay) {
            // Mature closure
            BigDecimal accumulated = fd.getAccumulatedInterest() != null ? fd.getAccumulatedInterest() : BigDecimal.ZERO;
            
            // Fallback for test FDs or unlinked FDs where interest was lost
            if (accumulated.compareTo(BigDecimal.ZERO) == 0 && "AT_MATURITY".equals(fd.getInterestPayoutMethod())) {
                LocalDate openedDate = fd.getOpenedDate() != null ? fd.getOpenedDate() : LocalDate.now();
                long daysPassed = ChronoUnit.DAYS.between(openedDate, today);
                if (daysPassed > 0) {
                    accumulated = principal
                            .multiply(fd.getInterestRate())
                            .multiply(BigDecimal.valueOf(daysPassed))
                            .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                            .divide(BigDecimal.valueOf(365), 6, RoundingMode.HALF_UP);
                }
            } else if (accumulated.compareTo(BigDecimal.ZERO) == 0) {
                 LocalDate openedDate = fd.getOpenedDate() != null ? fd.getOpenedDate() : LocalDate.now();
                 long daysPassed = ChronoUnit.DAYS.between(openedDate, today);
                 if (daysPassed > 0) {
                     accumulated = principal
                            .multiply(fd.getInterestRate())
                            .multiply(BigDecimal.valueOf(daysPassed))
                            .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                            .divide(BigDecimal.valueOf(365), 6, RoundingMode.HALF_UP);
                 }
            }
            
            netAmountToCredit = principal.add(accumulated);
        } else {
            // Premature closure
            if ("MONTHLY".equals(fd.getInterestPayoutMethod())) {
                LocalDate openedDate = fd.getOpenedDate() != null ? fd.getOpenedDate() : LocalDate.now();
                long daysPassed = ChronoUnit.DAYS.between(openedDate, today);
                BigDecimal totalGenerated = principal
                        .multiply(fd.getInterestRate())
                        .multiply(BigDecimal.valueOf(daysPassed))
                        .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                        .divide(BigDecimal.valueOf(365), 6, RoundingMode.HALF_UP);
                
                BigDecimal accumulated = fd.getAccumulatedInterest() != null ? fd.getAccumulatedInterest() : BigDecimal.ZERO;
                paidInterestToDeduct = totalGenerated.subtract(accumulated);
                
                if (paidInterestToDeduct.compareTo(BigDecimal.ZERO) < 0) {
                    paidInterestToDeduct = BigDecimal.ZERO;
                }
                
                netAmountToCredit = principal.subtract(paidInterestToDeduct);
            } else {
                // AT_MATURITY: No interest paid yet, just return principal
                netAmountToCredit = principal;
            }
        }
        
        // Prevent negative total payout (though very unlikely)
        if (netAmountToCredit.compareTo(BigDecimal.ZERO) < 0) {
            netAmountToCredit = BigDecimal.ZERO;
        }

        // Update Savings Account
        savingsAcc.setBalance(savingsAcc.getBalance().add(netAmountToCredit));
        accountRepository.save(savingsAcc);
        
        // Create Transaction
        Transaction tx = new Transaction();
        tx.setAccount(savingsAcc);
        tx.setAmount(netAmountToCredit);
        tx.setTransactionType("DEPOSIT");
        tx.setReference("FD Closure: " + fd.getFdNumber());
        tx.setBalanceAfter(savingsAcc.getBalance());
        
        // Provide a dummy UUID for processedBy if not using a security context
        tx.setProcessedBy(UUID.randomUUID());
        
        tx.setTransactionTimestamp(java.time.LocalDateTime.now());
        Integer currentBranchId = branchContext.extractBranchId(request);
        if (currentBranchId != null) {
            tx.setBranchId(currentBranchId);
        } else {
            tx.setBranchId(savingsAcc.getBranchId() != null ? savingsAcc.getBranchId() : 1);
        }
        transactionRepository.save(tx);
        
        // Close FD
        fd.setStatus("CLOSED");
        fd.setPrincipalAmount(BigDecimal.ZERO);
        fd.setAccumulatedInterest(BigDecimal.ZERO);
        fdRepository.save(fd);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Fixed Deposit closed successfully");
        response.put("netAmountCredited", netAmountToCredit);
        response.put("deductedInterest", paidInterestToDeduct);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateFixedDepositStatus(@PathVariable UUID id, @RequestBody Map<String, String> payload, HttpServletRequest request) {
        Optional<FixedDeposit> fdOpt = fdRepository.findById(id);
        if (fdOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        FixedDeposit fd = fdOpt.get();
        Integer currentBranchId = branchContext.extractBranchId(request);
        if (currentBranchId != null && fd.getBranchId() != null && !currentBranchId.equals(fd.getBranchId())) {
             return ResponseEntity.status(403).body("Not authorized to update FD of another branch");
        }

        String newStatus = payload.get("status");
        if (newStatus != null) {
            fd.setStatus(newStatus);
            fdRepository.save(fd);
        }
        return ResponseEntity.ok(Map.of("message", "Fixed deposit status updated successfully"));
    }

    static class RenewRequest {
        public UUID typeId;
        public Integer termMonths;
        public String interestPayoutMethod;
        public String maturityInstruction;
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<?> renewFixedDeposit(@PathVariable UUID id, @RequestBody RenewRequest request, HttpServletRequest httpReq) {
        Optional<FixedDeposit> fdOpt = fdRepository.findById(id);
        if (fdOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        FixedDeposit fd = fdOpt.get();
        Integer currentBranchId = branchContext.extractBranchId(httpReq);
        if (currentBranchId != null && fd.getBranchId() != null && !currentBranchId.equals(fd.getBranchId())) {
             return ResponseEntity.status(403).body("Not authorized to renew FD of another branch");
        }

        boolean isMatured = "MATURED".equals(fd.getStatus()) || 
                            (fd.getMaturityDate() != null && !LocalDate.now().isBefore(fd.getMaturityDate()));
        if (!isMatured) {
            return ResponseEntity.badRequest().body("Fixed Deposit must be in MATURED state to renew manually");
        }

        FixedDepositType currentType = typeRepository.findById(request.typeId).orElse(null);
        if (currentType == null) {
            return ResponseEntity.badRequest().body("Invalid Fixed Deposit Type");
        }

        // Process previous term's interest payout before renewing
        if (fd.getPrincipalAmount() != null && fd.getInterestRate() != null && fd.getOpenedDate() != null) {
            LocalDate startD = fd.getLastInterestPayoutDate() != null ? fd.getLastInterestPayoutDate() : fd.getOpenedDate();
            LocalDate endD = fd.getMaturityDate() != null ? fd.getMaturityDate() : LocalDate.now();
            if (startD.isBefore(endD)) {
                long days = java.time.temporal.ChronoUnit.DAYS.between(startD, endD);
                if (days > 0) {
                    int daysInYear = Year.isLeap(endD.getYear()) ? 366 : 365;
                    BigDecimal expectedInterest = fd.getPrincipalAmount()
                            .multiply(fd.getInterestRate())
                            .divide(BigDecimal.valueOf(100), 10, java.math.RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(days))
                            .divide(BigDecimal.valueOf(daysInYear), 6, java.math.RoundingMode.HALF_UP);
                    
                    BigDecimal currentAcc = fd.getAccumulatedInterest() != null ? fd.getAccumulatedInterest() : BigDecimal.ZERO;
                    BigDecimal missingInterest = expectedInterest.subtract(currentAcc);
                    
                    if (missingInterest.compareTo(BigDecimal.ZERO) > 0) {
                        fd.setAccumulatedInterest(currentAcc.add(missingInterest));
                    }
                }
            }
        }
        
        // Handle payout according to the old instruction
        BigDecimal accumulated = fd.getAccumulatedInterest() != null ? fd.getAccumulatedInterest() : BigDecimal.ZERO;
        String oldInstruction = fd.getMaturityInstruction();
        
        if ("REINVEST_PRINCIPAL_AND_INTEREST".equals(oldInstruction)) {
            fd.setPrincipalAmount(fd.getPrincipalAmount().add(accumulated));
            fd.setAccumulatedInterest(BigDecimal.ZERO);
        } else if ("REINVEST_PRINCIPAL_ONLY".equals(oldInstruction) || "REINVEST_PRINCIPAL_PAY_INTEREST".equals(oldInstruction)) {
            if (accumulated.compareTo(BigDecimal.ZERO) > 0 && fd.getLinkedSavingsAccountId() != null) {
                com.hmcs.savings.entity.Account savingsAcc = accountRepository.findById(fd.getLinkedSavingsAccountId()).orElse(null);
                if (savingsAcc != null && "ACTIVE".equals(savingsAcc.getStatus())) {
                    BigDecimal netAmount = accumulated;
                    if (Boolean.FALSE.equals(fd.getHasSubmittedTaxForm())) {
                        BigDecimal tax = accumulated.multiply(new BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_UP);
                        netAmount = accumulated.subtract(tax).setScale(2, java.math.RoundingMode.HALF_UP);
                    }

                    if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
                        savingsAcc.setBalance(savingsAcc.getBalance().add(netAmount));
                        accountRepository.save(savingsAcc);
                        
                        com.hmcs.savings.entity.Transaction tx = new com.hmcs.savings.entity.Transaction();
                        tx.setAccount(savingsAcc);
                        tx.setTransactionType("FD_MATURITY_INTEREST");
                        tx.setAmount(netAmount);
                        tx.setBalanceAfter(savingsAcc.getBalance());
                        tx.setReference("FD Interest Payout for " + fd.getFdNumber());
                        tx.setProcessedBy(java.util.UUID.randomUUID());
                        tx.setTransactionTimestamp(java.time.LocalDateTime.now());
                        tx.setBranchId(fd.getBranchId());
                        transactionRepository.save(tx);
                    }
                }
            }
            fd.setAccumulatedInterest(BigDecimal.ZERO);
        }

        fd.setStatus("RENEWED");
        fdRepository.save(fd);

        // Create new Fixed Deposit
        FixedDeposit newFd = new FixedDeposit();
        newFd.setTenantId(fd.getTenantId());
        newFd.setMemberId(fd.getMemberId());
        newFd.setMemberId2(fd.getMemberId2());
        newFd.setMemberId3(fd.getMemberId3());
        newFd.setFdNumber("FD-" + (100000 + new Random().nextInt(900000)));
        newFd.setLinkedSavingsAccountId(fd.getLinkedSavingsAccountId());
        newFd.setBranchId(fd.getBranchId());
        newFd.setHasSubmittedTaxForm(fd.getHasSubmittedTaxForm());

        
        newFd.setTypeId(request.typeId);
        newFd.setTermMonths(request.termMonths);
        newFd.setInterestPayoutMethod(request.interestPayoutMethod);
        newFd.setMaturityInstruction(request.maturityInstruction);
        newFd.setPrincipalAmount(fd.getPrincipalAmount()); // principalAmount may have been increased by accumulated interest above

        BigDecimal newRate = "MONTHLY".equals(request.interestPayoutMethod) 
                ? currentType.getInterestRateMonthly() 
                : currentType.getInterestRateMaturity();
        newFd.setInterestRate(newRate);

        LocalDate newOpenedDate = LocalDate.now(); // Starts from TODAY
        newFd.setOpenedDate(newOpenedDate);
        newFd.setLastInterestPayoutDate(newOpenedDate);
        newFd.setMaturityDate(newOpenedDate.plusMonths(request.termMonths));
        newFd.setStatus("ACTIVE");

        newFd = fdRepository.save(newFd);
        
        // Create Renewal History record
        FixedDepositRenewal renewal = new FixedDepositRenewal();
        renewal.setOldFdId(fd.getFdId());
        renewal.setNewFdId(newFd.getFdId());
        renewal.setRenewalDate(LocalDate.now());
        renewal.setReinvestedAmount(newFd.getPrincipalAmount());
        renewal.setTenantId(fd.getTenantId());
        renewal.setBranchId(fd.getBranchId());
        // Currently processed by (if user logic exists, can set it, left null otherwise)
        renewalRepository.save(renewal);
        
        return ResponseEntity.ok(Map.of("message", "Fixed deposit renewed successfully", "maturityDate", newFd.getMaturityDate().toString(), "newFdNumber", newFd.getFdNumber()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFixedDeposit(@PathVariable UUID id, HttpServletRequest request) {
        Optional<FixedDeposit> fdOpt = fdRepository.findById(id);
        if (fdOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        FixedDeposit fd = fdOpt.get();
        // Option to restrict deletion only for the same branch or ADMIN can be added here
        Integer currentBranchId = branchContext.extractBranchId(request);
        if (currentBranchId != null && fd.getBranchId() != null && !currentBranchId.equals(fd.getBranchId())) {
             return ResponseEntity.status(403).body("Not authorized to delete FD of another branch");
        }

        fdRepository.delete(fd);
        return ResponseEntity.ok(Map.of("message", "Fixed deposit deleted successfully"));
    }
}
