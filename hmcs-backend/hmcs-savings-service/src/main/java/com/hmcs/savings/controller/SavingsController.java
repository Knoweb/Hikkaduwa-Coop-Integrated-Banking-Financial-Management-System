package com.hmcs.savings.controller;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.entity.PendingApproval;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.TransactionRepository;
import com.hmcs.savings.repository.PendingApprovalRepository;
import com.hmcs.savings.security.BranchContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

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
    private final RestTemplate restTemplate;
    private final PendingApprovalRepository pendingApprovalRepository;

    public SavingsController(AccountRepository accountRepository,
                             TransactionRepository transactionRepository,
                             BranchContext branchContext,
                             com.hmcs.savings.repository.SavingsAccountTypeRepository savingsAccountTypeRepository,
                             com.hmcs.savings.repository.DailyBalanceRepository dailyBalanceRepository,
                             RestTemplate restTemplate,
                             PendingApprovalRepository pendingApprovalRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.branchContext = branchContext;
        this.savingsAccountTypeRepository = savingsAccountTypeRepository;
        this.dailyBalanceRepository = dailyBalanceRepository;
        this.restTemplate = restTemplate;
        this.pendingApprovalRepository = pendingApprovalRepository;
    }

    @GetMapping("/savings")
    public ResponseEntity<List<Account>> getAccounts(
            HttpServletRequest request,
            @RequestParam(value = "branchOnly", defaultValue = "false") boolean branchOnly) {
        List<Account> accounts;
        if (branchOnly) {
            Integer branchId = branchContext.extractBranchId(request);
            accounts = accountRepository.findAll().stream()
                    .filter(a -> branchId == null || branchId.equals(a.getBranchId()))
                    .collect(Collectors.toList());
        } else {
            // Return all accounts - supports cross-branch banking
            accounts = accountRepository.findAll();
        }
        return ResponseEntity.ok(accounts);
    }

    // /savings/global - alias for cross-branch access via TransactionModal
    @GetMapping("/savings/global")
    public ResponseEntity<List<Account>> getGlobalAccounts() {
        return ResponseEntity.ok(accountRepository.findAll());
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
        public Boolean hasSubmittedTaxForm;
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
        
        if (body.hasSubmittedTaxForm != null) {
            account.setHasSubmittedTaxForm(body.hasSubmittedTaxForm);
        } else {
            account.setHasSubmittedTaxForm(false);
        }

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
            tx.setTransactionType("INITIAL_DEPOSIT");
            tx.setAmount(body.initialDeposit);
            tx.setBalanceAfter(body.initialDeposit);
            tx.setBranchId(branchId);
            tx.setProcessedBy(UUID.randomUUID()); // System/Teller ID
            transactionRepository.save(tx);
        }

        return ResponseEntity.ok(savedAccount);
    }

    // DTO for transaction
    public static class TransactionRequest {
        public String accountNumber;
        public BigDecimal amount;
        public String reference;
        public boolean requestApproval;
    }

    // 3. POST /api/v1/transactions/deposit - Process cash deposit
    @PostMapping("/transactions/deposit")
    public ResponseEntity<?> deposit(@RequestBody TransactionRequest body, HttpServletRequest request) {
        Account account = accountRepository.findByAccountNumber(body.accountNumber);
        if (account == null) {
            return ResponseEntity.badRequest().body("Account not found");
        }
        
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            return ResponseEntity.badRequest().body("Account is not ACTIVE. Cannot deposit.");
        }

        if (body.amount == null || body.amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Invalid deposit amount");
        }

        BigDecimal newBalance = account.getBalance().add(body.amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Integer currentBranchId = branchContext.extractBranchId(request);
        if (currentBranchId == null) currentBranchId = 1;

        Transaction tx = new Transaction();
        tx.setAccount(account);
        tx.setTransactionType("DEPOSIT");
        tx.setAmount(body.amount);
        tx.setBalanceAfter(newBalance);
        tx.setReference(body.reference);
        tx.setBranchId(currentBranchId);
        tx.setProcessedBy(UUID.randomUUID()); // System/Teller ID
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
        
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            return ResponseEntity.badRequest().body("Account is not ACTIVE. Cannot withdraw.");
        }

        if (body.amount == null || body.amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Invalid withdrawal amount");
        }
        
        // Minor Account Check
        String accType = account.getAccountType() != null ? account.getAccountType().toUpperCase() : "";
        boolean isMinor = accType.contains("LAMA") || accType.contains("ARUNALU") || accType.contains("KEKULU") || accType.contains("CHILD");
        
        if (isMinor) {
            if (body.requestApproval) {
                PendingApproval pa = new PendingApproval();
                pa.setAccount(account);
                pa.setTransactionType("WITHDRAWAL");
                pa.setAmount(body.amount);
                pa.setRequestedBy(UUID.randomUUID()); // teller UUID (would come from token)
                pendingApprovalRepository.save(pa);
                return ResponseEntity.ok(Map.of("message", "APPROVAL_REQUESTED", "approvalId", pa.getApprovalId()));
            } else {
                return ResponseEntity.badRequest().body("Minor Account Withdrawal Requires Branch Manager Authorization.");
            }
        }

        // Minimum Balance Check (Must maintain 500)
        BigDecimal minBalance = new BigDecimal("500.00");
        BigDecimal availableBalance = account.getBalance().subtract(minBalance);
        if (availableBalance.compareTo(body.amount) < 0) {
            return ResponseEntity.badRequest().body("Insufficient available balance. Must maintain Rs.500 minimum balance.");
        }
        

        BigDecimal newBalance = account.getBalance().subtract(body.amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Integer currentBranchId = branchContext.extractBranchId(request);
        if (currentBranchId == null) currentBranchId = 1;

        Transaction tx = new Transaction();
        tx.setAccount(account);
        tx.setTransactionType("WITHDRAWAL");
        tx.setAmount(body.amount);
        tx.setBalanceAfter(newBalance);
        tx.setReference(body.reference);
        tx.setBranchId(currentBranchId);
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

    // 7. GET /api/v1/savings/approvals - Fetch pending approvals (Manager Only)
    @GetMapping("/approvals")
    public ResponseEntity<?> getPendingApprovals() {
        List<PendingApproval> pending = pendingApprovalRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        return ResponseEntity.ok(pending);
    }

    // 8. POST /api/v1/savings/approvals/{id}/approve - Approve transaction
    @PostMapping("/approvals/{id}/approve")
    public ResponseEntity<?> approveTransaction(@PathVariable UUID id, HttpServletRequest request) {
        Optional<PendingApproval> approvalOpt = pendingApprovalRepository.findById(id);
        if (approvalOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PendingApproval pa = approvalOpt.get();
        if (!"PENDING".equals(pa.getStatus())) {
            return ResponseEntity.badRequest().body("Request is already processed.");
        }

        Account account = pa.getAccount();
        BigDecimal newBalance = account.getBalance();

        if ("WITHDRAWAL".equals(pa.getTransactionType())) {
            newBalance = newBalance.subtract(pa.getAmount());
        } else if ("DEPOSIT".equals(pa.getTransactionType())) {
            newBalance = newBalance.add(pa.getAmount());
        }

        account.setBalance(newBalance);
        accountRepository.save(account);

        Integer currentBranchId = branchContext.extractBranchId(request);
        if (currentBranchId == null) currentBranchId = 1;

        Transaction tx = new Transaction();
        tx.setAccount(account);
        tx.setTransactionType(pa.getTransactionType());
        tx.setAmount(pa.getAmount());
        tx.setBalanceAfter(newBalance);
        tx.setReference("Approved Request");
        tx.setBranchId(currentBranchId);
        tx.setManagerOverrideUsername("MANAGER_APPROVED");
        tx.setProcessedBy(pa.getRequestedBy());
        transactionRepository.save(tx);

        pa.setStatus("APPROVED");
        pa.setResolvedAt(java.time.LocalDateTime.now());
        // pa.setManagerId(managerUuid) // If we extract from token
        pendingApprovalRepository.save(pa);

        return ResponseEntity.ok(Map.of("message", "Transaction Approved and Executed", "transactionId", tx.getTransactionId()));
    }

    // 9. POST /api/v1/savings/approvals/{id}/reject - Reject transaction
    @PostMapping("/approvals/{id}/reject")
    public ResponseEntity<?> rejectTransaction(@PathVariable UUID id) {
        Optional<PendingApproval> approvalOpt = pendingApprovalRepository.findById(id);
        if (approvalOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PendingApproval pa = approvalOpt.get();
        if (!"PENDING".equals(pa.getStatus())) {
            return ResponseEntity.badRequest().body("Approval is already processed.");
        }

        pa.setStatus("REJECTED");
        pa.setResolvedAt(java.time.LocalDateTime.now());
        pendingApprovalRepository.save(pa);

        return ResponseEntity.ok(Map.of("message", "Transaction Rejected"));
    }
}
