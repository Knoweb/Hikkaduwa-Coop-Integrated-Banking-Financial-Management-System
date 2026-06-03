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

    public SavingsController(AccountRepository accountRepository,
                             TransactionRepository transactionRepository,
                             BranchContext branchContext) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.branchContext = branchContext;
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
        public String accountType;
        public BigDecimal initialDeposit;
    }

    // 2. POST /api/v1/accounts - Open a new account
    @PostMapping("/accounts")
    public ResponseEntity<?> openAccount(@RequestBody OpenAccountRequest body, HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        if (branchId == null) {
            branchId = 1; // Fallback to branch 1
        }

        Account account = new Account();
        account.setAccountNumber("ACC-" + (100000 + new Random().nextInt(900000)));
        account.setMemberId(body.memberId);
        account.setAccountType(body.accountType != null ? body.accountType : "REGULAR");
        account.setBalance(body.initialDeposit != null ? body.initialDeposit : BigDecimal.ZERO);
        account.setBranchId(branchId);
        account.setStatus("ACTIVE");

        Account savedAccount = accountRepository.save(account);

        // Record initial deposit transaction if deposit > 0
        if (body.initialDeposit != null && body.initialDeposit.compareTo(BigDecimal.ZERO) > 0) {
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
}
