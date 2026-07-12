package com.hmcs.savings.controller;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.FixedDeposit;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.FixedDepositRepository;
import com.hmcs.savings.repository.TransactionRepository;
import com.hmcs.savings.security.BranchContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.hmcs.savings.controller.dto.NotificationDTO;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/v1/branch")
public class BranchActivityController {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final FixedDepositRepository fixedDepositRepository;
    private final BranchContext branchContext;

    public BranchActivityController(AccountRepository accountRepository,
                                    TransactionRepository transactionRepository,
                                    FixedDepositRepository fixedDepositRepository,
                                    BranchContext branchContext) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.fixedDepositRepository = fixedDepositRepository;
        this.branchContext = branchContext;
    }

    @Data
    public static class ActivityLogDTO {
        private String id;
        private String type; // DEPOSIT, WITHDRAWAL, NEW_SAVINGS, NEW_FD
        private LocalDateTime timestamp;
        private BigDecimal amount;
        private String reference;
    }

    @GetMapping("/activities")
    public ResponseEntity<List<ActivityLogDTO>> getBranchActivities(
            HttpServletRequest request,
            @RequestParam(required = false) String date) {
        Integer branchId = branchContext.extractBranchId(request);
        if (branchId == null) branchId = 1;

        Pageable top20 = PageRequest.of(0, 20);

        List<Transaction> transactions;
        List<Account> accounts;
        List<FixedDeposit> fds;

        if (date != null && !date.trim().isEmpty()) {
            java.time.LocalDate filterDate = java.time.LocalDate.parse(date);
            java.time.LocalDateTime startOfDay = filterDate.atStartOfDay();
            java.time.LocalDateTime endOfDay = filterDate.atTime(java.time.LocalTime.MAX);
            
            transactions = transactionRepository.findByBranchIdAndTransactionTimestampBetweenOrderByTransactionTimestampDesc(branchId, startOfDay, endOfDay, top20);
            accounts = accountRepository.findByBranchIdAndCreatedAtBetweenOrderByCreatedAtDesc(branchId, startOfDay, endOfDay, top20);
            fds = fixedDepositRepository.findByBranchIdAndOpenedDateOrderByOpenedDateDesc(branchId, filterDate, top20);
        } else {
            transactions = transactionRepository.findByBranchIdOrderByTransactionTimestampDesc(branchId, top20);
            accounts = accountRepository.findByBranchIdOrderByCreatedAtDesc(branchId, top20);
            fds = fixedDepositRepository.findByBranchIdOrderByOpenedDateDesc(branchId, top20);
        }

        List<ActivityLogDTO> activities = new ArrayList<>();

        for (Transaction tx : transactions) {
            ActivityLogDTO dto = new ActivityLogDTO();
            dto.setId(tx.getTransactionId().toString());
            dto.setType(tx.getTransactionType());
            dto.setTimestamp(tx.getTransactionTimestamp());
            dto.setAmount(tx.getAmount());
            String ref = "";
            try {
                if (tx.getAccount() != null) {
                    ref = tx.getAccount().getAccountNumber();
                }
            } catch (Exception e) {
                ref = "DELETED";
            }
            dto.setReference(ref);
            activities.add(dto);
        }

        for (Account acc : accounts) {
            ActivityLogDTO dto = new ActivityLogDTO();
            dto.setId(acc.getAccountId().toString());
            dto.setType("NEW_SAVINGS");
            dto.setTimestamp(acc.getCreatedAt() != null ? acc.getCreatedAt() : (acc.getOpenedDate() != null ? acc.getOpenedDate().atStartOfDay() : LocalDateTime.now()));
            dto.setAmount(acc.getInitialDeposit() != null ? acc.getInitialDeposit() : BigDecimal.ZERO);
            dto.setReference(acc.getAccountNumber());
            activities.add(dto);
        }

        for (FixedDeposit fd : fds) {
            ActivityLogDTO dto = new ActivityLogDTO();
            dto.setId(fd.getFdId().toString());
            dto.setType("NEW_FD");
            // FixedDeposit only has LocalDate for openedDate, so we convert it to LocalDateTime at midnight
            dto.setTimestamp(fd.getOpenedDate() != null ? fd.getOpenedDate().atStartOfDay() : LocalDateTime.now());
            dto.setAmount(fd.getPrincipalAmount());
            dto.setReference(fd.getFdNumber());
            activities.add(dto);
        }

        // Sort combined list by timestamp descending
        activities.sort(Comparator.comparing(ActivityLogDTO::getTimestamp).reversed());

        // Return top 20
        if (activities.size() > 20) {
            activities = activities.subList(0, 20);
        }

        return ResponseEntity.ok(activities);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDTO>> getBranchNotifications(HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        if (branchId == null) branchId = 1;

        List<FixedDeposit> allFds = fixedDepositRepository.findByBranchIdOrderByOpenedDateDesc(branchId, Pageable.unpaged());
        List<NotificationDTO> notifications = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (FixedDeposit fd : allFds) {
            if ("ACTIVE".equalsIgnoreCase(fd.getStatus()) || fd.getStatus() == null) {
                LocalDate maturityDate = fd.getOpenedDate().plusMonths(fd.getTermMonths());
                long daysUntilMaturity = ChronoUnit.DAYS.between(today, maturityDate);

                if (daysUntilMaturity <= 7) {
                    NotificationDTO notif = new NotificationDTO();
                    notif.setId(fd.getFdId().toString());
                    notif.setType("FD_MATURITY");
                    notif.setTimestamp(maturityDate.atStartOfDay());
                    notif.setRead(false);
                    
                    if (daysUntilMaturity < 0) {
                        notif.setTitle("Fixed Deposit Matured");
                        notif.setMessage("Fixed Deposit " + fd.getFdNumber() + " matured on " + maturityDate);
                    } else if (daysUntilMaturity == 0) {
                        notif.setTitle("Fixed Deposit Maturing Today");
                        notif.setMessage("Fixed Deposit " + fd.getFdNumber() + " matures today");
                    } else {
                        notif.setTitle("Fixed Deposit Maturing Soon");
                        notif.setMessage("Fixed Deposit " + fd.getFdNumber() + " matures in " + daysUntilMaturity + " days");
                    }
                    notifications.add(notif);
                }
            }
        }

        notifications.sort(Comparator.comparing(NotificationDTO::getTimestamp));
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/activity-details/{type}/{id}")
    public ResponseEntity<?> getActivityDetails(@PathVariable String type, @PathVariable UUID id) {
        Map<String, Object> details = new HashMap<>();
        
        if ("DEPOSIT".equals(type) || "WITHDRAWAL".equals(type) || "INITIAL_DEPOSIT".equals(type)) {
            Optional<Transaction> txOpt = transactionRepository.findById(id);
            if (txOpt.isPresent()) {
                Transaction tx = txOpt.get();
                details.put("transactionId", tx.getTransactionId());
                details.put("transactionType", tx.getTransactionType());
                details.put("amount", tx.getAmount());
                details.put("timestamp", tx.getTransactionTimestamp());
                details.put("balanceAfter", tx.getBalanceAfter());
                details.put("reference", tx.getReference());
                details.put("processedBy", tx.getProcessedBy());
                details.put("managerOverride", tx.getManagerOverrideUsername());
                if (tx.getAccount() != null) {
                    details.put("accountNumber", tx.getAccount().getAccountNumber());
                    details.put("memberId", tx.getAccount().getMemberId());
                    details.put("branchId", tx.getAccount().getBranchId());
                }
                return ResponseEntity.ok(details);
            }
        } else if ("NEW_SAVINGS".equals(type)) {
            Optional<Account> accOpt = accountRepository.findById(id);
            if (accOpt.isPresent()) {
                Account acc = accOpt.get();
                details.put("accountId", acc.getAccountId());
                details.put("accountNumber", acc.getAccountNumber());
                details.put("openedDate", acc.getOpenedDate());
                details.put("balance", acc.getBalance());
                details.put("status", acc.getStatus());
                details.put("memberId", acc.getMemberId());
                details.put("branchId", acc.getBranchId());
                return ResponseEntity.ok(details);
            }
        } else if ("NEW_FD".equals(type) || "FD_MATURED".equals(type)) {
            Optional<FixedDeposit> fdOpt = fixedDepositRepository.findById(id);
            if (fdOpt.isPresent()) {
                FixedDeposit fd = fdOpt.get();
                details.put("fdId", fd.getFdId());
                details.put("fdNumber", fd.getFdNumber());
                details.put("principalAmount", fd.getPrincipalAmount());
                details.put("interestRate", fd.getInterestRate());
                details.put("openedDate", fd.getOpenedDate());
                details.put("maturityDate", fd.getMaturityDate());
                details.put("status", fd.getStatus());
                details.put("memberId", fd.getMemberId());
                details.put("branchId", fd.getBranchId());
                return ResponseEntity.ok(details);
            }
        }
        
        return ResponseEntity.notFound().build();
    }
}
