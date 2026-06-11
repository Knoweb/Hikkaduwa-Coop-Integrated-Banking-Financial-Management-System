package com.hmcs.savings.controller;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.TransactionRepository;
import com.hmcs.savings.security.BranchContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class SavingsController {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BranchContext branchContext;
    private final com.hmcs.savings.repository.SavingsAccountTypeRepository savingsAccountTypeRepository;
    private final com.hmcs.savings.repository.DailyBalanceRepository dailyBalanceRepository;

    public SavingsController(AccountRepository accountRepository,
                             TransactionRepository transactionRepository,
                             BranchContext branchContext,
                             com.hmcs.savings.repository.SavingsAccountTypeRepository savingsAccountTypeRepository,
                             com.hmcs.savings.repository.DailyBalanceRepository dailyBalanceRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.branchContext = branchContext;
        this.savingsAccountTypeRepository = savingsAccountTypeRepository;
        this.dailyBalanceRepository = dailyBalanceRepository;
    }

    // 1. GET /api/v1/savings - Get all savings accounts (filtered by branch if applicable)
    @GetMapping("/savings")
    public ResponseEntity<List<Account>> getAccounts(HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        List<Account> accounts = accountRepository.findAll().stream()
                .filter(a -> branchId == null || branchId.equals(a.getBranchId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(accounts);
    }

    // DTO for openAccount
    public static class OpenAccountRequest {
        public UUID memberId;
        public String accountNumber;
        public String accountType;
        public BigDecimal initialDeposit;
        public String childName;
        public String childBirthCertificate;
        public String childDateOfBirth;
        public UUID memberId2;
        public UUID memberId3;
        public String occupation1;
        public String occupation2;
        public String occupation3;
        public String accountMode;
        public String modeOfOperation;
        public String witnessName;
        public String witnessAddress;
        public String specimenSignature;
    }

    // 2. POST /api/v1/accounts - Open a new account
    @PostMapping("/accounts")
    public ResponseEntity<?> openAccount(@RequestBody OpenAccountRequest body, HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        if (branchId == null) {
            branchId = 1; // Fallback to branch 1
        }

        Account account = new Account();
        if (body.accountNumber != null && !body.accountNumber.trim().isEmpty()) {
            account.setAccountNumber(body.accountNumber);
        } else {
            account.setAccountNumber("ACC-" + (100000 + new Random().nextInt(900000)));
        }
        account.setMemberId(body.memberId);
        account.setAccountType(body.accountType != null ? body.accountType : "REGULAR");
        account.setBalance(body.initialDeposit != null ? body.initialDeposit : BigDecimal.ZERO);
        account.setBranchId(branchId);
        account.setStatus("ACTIVE");
        
        if (body.memberId2 != null) account.setMemberId2(body.memberId2);
        if (body.memberId3 != null) account.setMemberId3(body.memberId3);
        if (body.occupation1 != null) account.setOccupation1(body.occupation1);
        if (body.occupation2 != null) account.setOccupation2(body.occupation2);
        if (body.occupation3 != null) account.setOccupation3(body.occupation3);
        if (body.accountMode != null) account.setAccountMode(body.accountMode);
        if (body.modeOfOperation != null) account.setModeOfOperation(body.modeOfOperation);
        if (body.witnessName != null) account.setWitnessName(body.witnessName);
        if (body.witnessAddress != null) account.setWitnessAddress(body.witnessAddress);
        if (body.specimenSignature != null) account.setSpecimenSignature(body.specimenSignature);
        
        if (body.childName != null && !body.childName.trim().isEmpty()) {
            account.setChildName(body.childName);
            account.setChildBirthCertificate(body.childBirthCertificate);
            if (body.childDateOfBirth != null && !body.childDateOfBirth.isEmpty()) {
                account.setChildDateOfBirth(java.time.LocalDate.parse(body.childDateOfBirth));
            }
        }

        // Fetch Savings Account Type to get correct interest rate
        String searchCode = body.accountType != null ? body.accountType.toUpperCase().trim() : "";
        if ("SAMANAYA".equals(searchCode)) searchCode = "NORMAL";
        java.util.Optional<com.hmcs.savings.entity.SavingsAccountType> typeOpt = savingsAccountTypeRepository.findByCode(searchCode);
        if (typeOpt.isPresent() && typeOpt.get().getInterestRate() != null) {
            account.setAnnualInterestRate(typeOpt.get().getInterestRate());
        }

        Account savedAccount = accountRepository.save(account);

        // Record initial deposit transaction if deposit > 0
        if (body.initialDeposit != null && body.initialDeposit.compareTo(BigDecimal.ZERO) > 0) {
            account.setInitialDeposit(body.initialDeposit);
            savedAccount = accountRepository.save(account);

            Transaction tx = new Transaction();
            tx.setAccount(savedAccount);
            tx.setTransactionType("DEPOSIT");
            tx.setAmount(body.initialDeposit);
            tx.setBalanceAfter(body.initialDeposit);
            tx.setProcessedBy(UUID.randomUUID()); // System/Teller ID
            transactionRepository.save(tx);
        }

        return ResponseEntity.ok(savedAccount);
    }

    // DTO for transaction
    public static class TransactionRequest {
        public String accountNumber;
        public BigDecimal amount;
    }

    // 3. POST /api/v1/transactions/deposit - Process cash deposit
    @PostMapping("/transactions/deposit")
    public ResponseEntity<?> deposit(@RequestBody TransactionRequest body, HttpServletRequest request) {
        Account account = accountRepository.findByAccountNumber(body.accountNumber);
        if (account == null) {
            return ResponseEntity.badRequest().body("Account not found");
        }

        if (body.amount == null || body.amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Invalid deposit amount");
        }

        BigDecimal newBalance = account.getBalance().add(body.amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction tx = new Transaction();
        tx.setAccount(account);
        tx.setTransactionType("DEPOSIT");
        tx.setAmount(body.amount);
        tx.setBalanceAfter(newBalance);
        tx.setProcessedBy(UUID.randomUUID());
        transactionRepository.save(tx);

        return ResponseEntity.ok(account);
    }

    // 4. POST /api/v1/transactions/withdraw - Process cash withdrawal
    @PostMapping("/transactions/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody TransactionRequest body, HttpServletRequest request) {
        Account account = accountRepository.findByAccountNumber(body.accountNumber);
        if (account == null) {
            return ResponseEntity.badRequest().body("Account not found");
        }

        if (body.amount == null || body.amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Invalid withdrawal amount");
        }

        if (account.getBalance().compareTo(body.amount) < 0) {
            return ResponseEntity.badRequest().body("Insufficient balance");
        }

        BigDecimal newBalance = account.getBalance().subtract(body.amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction tx = new Transaction();
        tx.setAccount(account);
        tx.setTransactionType("WITHDRAWAL");
        tx.setAmount(body.amount);
        tx.setBalanceAfter(newBalance);
        tx.setProcessedBy(UUID.randomUUID());
        transactionRepository.save(tx);

        return ResponseEntity.ok(account);
    }

    // 5. GET /api/v1/admin/summary - Fetch admin/dashboard summary
    @GetMapping("/admin/summary")
    public ResponseEntity<?> getAdminSummary(HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        List<Account> accounts = accountRepository.findAll().stream()
                .filter(a -> branchId == null || branchId.equals(a.getBranchId()))
                .collect(Collectors.toList());

        BigDecimal totalBalance = accounts.stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int activeAccounts = accounts.size();
        BigDecimal avgBalance = activeAccounts > 0 
                ? totalBalance.divide(new BigDecimal(activeAccounts), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ResponseEntity.ok(Map.of(
            "totalBalance", totalBalance,
            "activeAccounts", activeAccounts,
            "avgBalance", avgBalance
        ));
    }

    // 6. GET /api/v1/savings/{accountId}/passbook - Fetch passbook (transactions & interest)
    @GetMapping("/savings/{accountId}/passbook")
    public ResponseEntity<?> getPassbook(@PathVariable UUID accountId) {
        Optional<Account> accountOpt = accountRepository.findById(accountId);
        if (accountOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        List<Transaction> transactions = transactionRepository.findByAccountAccountId(accountId);
        
        // Use a generic find strategy for daily balances if specific method doesn't exist,
        // or just use findAll() and filter if necessary (for simplicity here, we'll fetch all and filter)
        List<com.hmcs.savings.entity.DailyBalance> dailyBalances = dailyBalanceRepository.findAll().stream()
                .filter(db -> db.getAccountId().equals(accountId))
                .collect(Collectors.toList());
                
        List<Map<String, Object>> dailyBalancesList = dailyBalances.stream().map(db -> {
            BigDecimal rate = db.getAnnualInterestRate() != null ? db.getAnnualInterestRate() : accountOpt.get().getAnnualInterestRate();
            BigDecimal dailyInterest = db.getClosingBalance()
                .multiply(rate)
                .divide(new BigDecimal("365"), 2, java.math.RoundingMode.HALF_UP);
                
            return Map.<String, Object>of(
                "id", db.getId(),
                "recordDate", db.getRecordDate(),
                "endOfDayBalance", db.getClosingBalance(),
                "annualInterestRate", rate,
                "dailyInterestEarned", dailyInterest
            );
        }).collect(Collectors.toList());
                
        return ResponseEntity.ok(Map.of(
            "account", accountOpt.get(),
            "transactions", transactions,
            "dailyBalances", dailyBalancesList
        ));
    }
}
