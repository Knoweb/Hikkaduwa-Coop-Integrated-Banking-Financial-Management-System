package com.hmcs.savings.service;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.FixedDeposit;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.multitenancy.TenantContext;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.FixedDepositRepository;
import com.hmcs.savings.repository.FixedDepositTypeRepository;
import com.hmcs.savings.repository.TransactionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class FixedDepositInterestService {

    private final FixedDepositRepository fdRepository;
    private final FixedDepositTypeRepository typeRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final com.hmcs.savings.repository.SchedulerLogRepository schedulerLogRepository;
    private final JdbcTemplate jdbcTemplate;

    private final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    public FixedDepositInterestService(FixedDepositRepository fdRepository,
                                       FixedDepositTypeRepository typeRepository,
                                       AccountRepository accountRepository,
                                       TransactionRepository transactionRepository,
                                       com.hmcs.savings.repository.SchedulerLogRepository schedulerLogRepository,
                                       JdbcTemplate jdbcTemplate) {
        this.fdRepository = fdRepository;
        this.typeRepository = typeRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.schedulerLogRepository = schedulerLogRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Gets all active tenant IDs from organizations table.
     * This ensures new tenants are picked up automatically as soon as they register,
     * even before they create any fixed deposits.
     */
    private List<Integer> getAllTenantIds() {
        return jdbcTemplate.queryForList(
            "SELECT organization_id FROM auth_service.organizations WHERE status = 'ACTIVE' AND organization_id > 0",
            Integer.class
        );
    }

    /**
     * Runs every day at 23:59 to accrue FD interest, process monthly payouts, and handle maturities.
     * Runs for ALL tenants.
     */
    @Scheduled(cron = "0 59 23 * * ?")
    public void scheduledProcessFixedDeposits() {
        List<Integer> tenantIds = getAllTenantIds();
        System.out.println("[FixedDepositInterestService] EOD running for tenants: " + tenantIds);
        for (Integer tenantId : tenantIds) {
            try {
                TenantContext.setTenantId(tenantId);
                processFixedDepositsForDate(LocalDate.now());

                com.hmcs.savings.entity.SchedulerLog log = new com.hmcs.savings.entity.SchedulerLog();
                log.setTaskName("EOD_FD");
                log.setExecutionTime(java.time.LocalDateTime.now());
                log.setStatus("SUCCESS");
                log.setDetails("EOD_FD: Tenant " + tenantId + " - Processed Fixed Deposits for " + LocalDate.now());
                schedulerLogRepository.save(log);
            } finally {
                TenantContext.clear();
            }
        }
    }

    /**
     * Runs on startup and every 10 minutes to catch up missed FD interest for ALL tenants.
     */
    @PostConstruct
    @Scheduled(fixedDelay = 600000)
    public void catchUpMissingFDInterest() {
        List<Integer> tenantIds = getAllTenantIds();
        System.out.println("[FixedDepositInterestService] Catch-up running for tenants: " + tenantIds);
        for (Integer tenantId : tenantIds) {
            try {
                TenantContext.setTenantId(tenantId);
                catchUpForTenant(tenantId);
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Transactional
    public void catchUpForTenant(Integer tenantId) {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        // Find the last successful EOD_FD run for this tenant
        com.hmcs.savings.entity.SchedulerLog lastLog = schedulerLogRepository
                .findFirstByTaskNameOrderByExecutionTimeDesc("EOD_FD").orElse(null);

        LocalDate lastProcessedDate;
        if (lastLog == null) {
            lastProcessedDate = yesterday.minusDays(1);
        } else {
            lastProcessedDate = lastLog.getExecutionTime().toLocalDate();
        }

        LocalDate dateToProcess = lastProcessedDate.plusDays(1);
        boolean caughtUpAny = false;

        while (!dateToProcess.isAfter(yesterday)) {
            processFixedDepositsForDate(dateToProcess);
            caughtUpAny = true;
            dateToProcess = dateToProcess.plusDays(1);
        }

        if (caughtUpAny) {
            com.hmcs.savings.entity.SchedulerLog log = new com.hmcs.savings.entity.SchedulerLog();
            log.setTaskName("EOD_FD");
            log.setExecutionTime(java.time.LocalDateTime.now());
            log.setStatus("SUCCESS");
            log.setDetails("CATCH-UP: Tenant " + tenantId + " - Recovered missing FD interest up to " + yesterday);
            schedulerLogRepository.save(log);
            System.out.println("[FixedDepositInterestService] Catch-up complete for tenant " + tenantId + " up to: " + yesterday);
        }
    }

    public void processFixedDepositsForDate(LocalDate today) {
        List<FixedDeposit> activeFDs = fdRepository.findByStatus("ACTIVE");
        for (FixedDeposit fd : activeFDs) {
            processSingleFixedDepositForDate(fd, today);
            fdRepository.save(fd);
        }
    }

    @Transactional
    public void catchUpSingleFD(FixedDeposit fd) {
        if (fd.getOpenedDate() == null || !fd.getOpenedDate().isBefore(LocalDate.now())) {
            return;
        }

        LocalDate dateToProcess = fd.getOpenedDate().plusDays(1);
        LocalDate today = LocalDate.now();

        while (!dateToProcess.isAfter(today)) {
            processSingleFixedDepositForDate(fd, dateToProcess);
            dateToProcess = dateToProcess.plusDays(1);
        }
        fdRepository.save(fd);
    }

    private void processSingleFixedDepositForDate(FixedDeposit fd, LocalDate today) {
        int daysInYear = Year.isLeap(today.getYear()) ? 366 : 365;
        BigDecimal daysInYearBd = BigDecimal.valueOf(daysInYear);
        BigDecimal hundred = BigDecimal.valueOf(100);

        // 1. Daily Accrual
        if (fd.getPrincipalAmount() != null && fd.getInterestRate() != null) {
            BigDecimal dailyInterest = fd.getPrincipalAmount()
                    .multiply(fd.getInterestRate())
                    .divide(hundred, 10, RoundingMode.HALF_UP)
                    .divide(daysInYearBd, 6, RoundingMode.HALF_UP);

            if (fd.getAccumulatedInterest() == null) {
                fd.setAccumulatedInterest(BigDecimal.ZERO);
            }
            fd.setAccumulatedInterest(fd.getAccumulatedInterest().add(dailyInterest));
        }

        // 2. Check Monthly Payout
        boolean isMaturityDay = !today.isBefore(fd.getMaturityDate());

        if ("MONTHLY".equals(fd.getInterestPayoutMethod())) {
            LocalDate nextPayoutDate = fd.getLastInterestPayoutDate() != null
                    ? fd.getLastInterestPayoutDate().plusMonths(1)
                    : fd.getOpenedDate().plusMonths(1);

            if (!today.isBefore(nextPayoutDate) || isMaturityDay) {
                creditToSavings(fd, fd.getAccumulatedInterest(), "FD_MONTHLY_INTEREST");
                fd.setAccumulatedInterest(BigDecimal.ZERO);
                fd.setLastInterestPayoutDate(today);
            }
        }

        // 3. Handle Maturity
        if (isMaturityDay) {
            BigDecimal accumulated = fd.getAccumulatedInterest() != null ? fd.getAccumulatedInterest() : BigDecimal.ZERO;
            String instruction = fd.getMaturityInstruction();

            if ("REINVEST_PRINCIPAL_AND_INTEREST".equals(instruction)) {
                fd.setPrincipalAmount(fd.getPrincipalAmount().add(accumulated));
                fd.setAccumulatedInterest(BigDecimal.ZERO);

            } else if ("REINVEST_PRINCIPAL_ONLY".equals(instruction) || "REINVEST_PRINCIPAL_PAY_INTEREST".equals(instruction)) {
                if (accumulated.compareTo(BigDecimal.ZERO) > 0) {
                    creditToSavings(fd, accumulated, "FD_MATURITY_INTEREST");
                }
                fd.setAccumulatedInterest(BigDecimal.ZERO);

            } else if ("CLOSE_AND_PAYOUT".equals(instruction)) {
                BigDecimal totalPayout = fd.getPrincipalAmount().add(accumulated);
                if (totalPayout.compareTo(BigDecimal.ZERO) > 0) {
                    creditToSavings(fd, totalPayout, "FD_CLOSURE_PAYOUT");
                }
                fd.setAccumulatedInterest(BigDecimal.ZERO);
                fd.setPrincipalAmount(BigDecimal.ZERO);
                fd.setStatus("CLOSED");
            }

            if (!"CLOSED".equals(fd.getStatus())) {
                fd.setStatus("MATURED");
            }
        }
    }

    private void creditToSavings(FixedDeposit fd, BigDecimal amount, String transactionType) {
        if (fd.getLinkedSavingsAccountId() == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Account savingsAcc = accountRepository.findById(fd.getLinkedSavingsAccountId()).orElse(null);
        if (savingsAcc != null && "ACTIVE".equals(savingsAcc.getStatus())) {

            BigDecimal netAmount = amount;
            if (Boolean.FALSE.equals(fd.getHasSubmittedTaxForm())) {
                BigDecimal tax = amount.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
                netAmount = amount.subtract(tax);
            }
            netAmount = netAmount.setScale(2, RoundingMode.HALF_UP);

            if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
                savingsAcc.setBalance(savingsAcc.getBalance().add(netAmount));
                accountRepository.save(savingsAcc);

                Transaction transaction = new Transaction();
                transaction.setAccount(savingsAcc);
                transaction.setTransactionType(transactionType);
                transaction.setAmount(netAmount);
                transaction.setBalanceAfter(savingsAcc.getBalance());
                transaction.setProcessedBy(SYSTEM_USER_ID);
                transaction.setReference("Linked to FD: " + fd.getFdNumber());
                transactionRepository.save(transaction);
            }
        }
    }
}
