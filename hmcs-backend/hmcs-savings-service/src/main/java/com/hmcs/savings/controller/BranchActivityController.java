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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

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
    public ResponseEntity<List<ActivityLogDTO>> getBranchActivities(HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        if (branchId == null) branchId = 1;

        Pageable top20 = PageRequest.of(0, 20);

        List<Transaction> transactions = transactionRepository.findByBranchIdOrderByTransactionTimestampDesc(branchId, top20);
        List<Account> accounts = accountRepository.findByBranchIdOrderByCreatedAtDesc(branchId, top20);
        List<FixedDeposit> fds = fixedDepositRepository.findByBranchIdOrderByOpenedDateDesc(branchId, top20);

        List<ActivityLogDTO> activities = new ArrayList<>();

        for (Transaction tx : transactions) {
            ActivityLogDTO dto = new ActivityLogDTO();
            dto.setId(tx.getTransactionId().toString());
            dto.setType(tx.getTransactionType());
            dto.setTimestamp(tx.getTransactionTimestamp());
            dto.setAmount(tx.getAmount());
            dto.setReference(tx.getAccount() != null ? tx.getAccount().getAccountNumber() : "");
            activities.add(dto);
        }

        for (Account acc : accounts) {
            ActivityLogDTO dto = new ActivityLogDTO();
            dto.setId(acc.getAccountId().toString());
            dto.setType("NEW_SAVINGS");
            dto.setTimestamp(acc.getCreatedAt() != null ? acc.getCreatedAt() : LocalDateTime.now());
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
}
