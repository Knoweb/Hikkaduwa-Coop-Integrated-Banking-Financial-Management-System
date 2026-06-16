package com.hmcs.savings.service;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.DailyBalance;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.DailyBalanceRepository;
import com.hmcs.savings.repository.TransactionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class InterestCalculationService {

    private final AccountRepository accountRepository;
    private final DailyBalanceRepository dailyBalanceRepository;
    private final TransactionRepository transactionRepository;

    private final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    public InterestCalculationService(AccountRepository accountRepository,
                                      DailyBalanceRepository dailyBalanceRepository,
                                      TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.dailyBalanceRepository = dailyBalanceRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Runs on server startup to backfill any missing daily balance snapshots
     * for days the server was offline.
     *
     * For each missing day, it determines the EXACT closing balance by looking at
     * the last transaction on or before that day. This ensures interest is calculated
     * on the correct historical balance — not the current balance.
     */
    @PostConstruct
    @Transactional
    public void catchUpMissingDailyBalances() {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        List<Account> activeAccounts = accountRepository.findAll().stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .toList();

        for (Account account : activeAccounts) {
            // Start from account opening date (or 3 months back as a limit)
            LocalDate startDate = account.getOpenedDate() != null
                    ? account.getOpenedDate()
                    : yesterday.minusMonths(3);

            // Get all transactions for this account, sorted by timestamp ascending
            List<Transaction> allTransactions = transactionRepository
                    .findByAccountAccountId(account.getAccountId())
                    .stream()
                    .sorted(Comparator.comparing(Transaction::getTransactionTimestamp))
                    .toList();

            // Get all already-recorded snapshot dates
            List<LocalDate> recordedDates = dailyBalanceRepository
                    .findByAccountId(account.getAccountId())
                    .stream()
                    .map(DailyBalance::getRecordDate)
                    .toList();

            // Walk through each day from startDate up to yesterday
            LocalDate date = startDate;
            while (!date.isAfter(yesterday)) {
                if (!recordedDates.contains(date)) {
                    // Find the closing balance for this day:
                    // = balanceAfter of the LAST transaction on or before end of this day
                    LocalDateTime endOfDay = date.atTime(23, 59, 59);

                    Optional<Transaction> lastTx = allTransactions.stream()
                            .filter(tx -> !tx.getTransactionTimestamp().isAfter(endOfDay))
                            .reduce((first, second) -> second); // gets the last element

                    // If no transaction yet before this date, skip (account not yet opened)
                    if (lastTx.isEmpty()) {
                        date = date.plusDays(1);
                        continue;
                    }

                    BigDecimal closingBalance = lastTx.get().getBalanceAfter();

                    DailyBalance snapshot = new DailyBalance();
                    snapshot.setAccountId(account.getAccountId());
                    snapshot.setRecordDate(date);
                    snapshot.setClosingBalance(closingBalance);
                    snapshot.setAnnualInterestRate(account.getAnnualInterestRate() != null
                            ? account.getAnnualInterestRate()
                            : new BigDecimal("0.0600"));
                    dailyBalanceRepository.save(snapshot);
                }
                date = date.plusDays(1);
            }
        }

        System.out.println("[InterestCalculationService] Catch-up complete for missing daily snapshots up to: " + yesterday);
    }

    /**
     * Runs every day at 23:59 to take an end-of-day snapshot of the balance
     * and calculate/credit interest if it's the last day of the month.
     */
    @Scheduled(cron = "0 59 23 * * ?")
    @Transactional
    public void processDailyBalancesAndMonthlyInterest() {
        LocalDate today = LocalDate.now();
        List<Account> activeAccounts = accountRepository.findAll().stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .toList();

        int daysInYear = Year.isLeap(today.getYear()) ? 366 : 365;

        for (Account account : activeAccounts) {
            // Save today's snapshot only if not already recorded
            boolean alreadyRecorded = dailyBalanceRepository
                    .findByAccountId(account.getAccountId())
                    .stream()
                    .anyMatch(db -> today.equals(db.getRecordDate()));

            if (!alreadyRecorded) {
                DailyBalance snapshot = new DailyBalance();
                snapshot.setAccountId(account.getAccountId());
                snapshot.setRecordDate(today);
                snapshot.setClosingBalance(account.getBalance());
                snapshot.setAnnualInterestRate(account.getAnnualInterestRate() != null
                        ? account.getAnnualInterestRate()
                        : new BigDecimal("0.0600"));
                dailyBalanceRepository.save(snapshot);
            }

            // If last day of month → credit monthly interest
            if (today.equals(today.withDayOfMonth(today.lengthOfMonth()))) {
                calculateAndCreditMonthlyInterest(account, today, daysInYear);
            }
        }
    }

    private void calculateAndCreditMonthlyInterest(Account account, LocalDate endOfMonth, int daysInYear) {
        LocalDate startOfMonth = endOfMonth.withDayOfMonth(1);

        List<DailyBalance> monthBalances = dailyBalanceRepository
                .findByAccountIdAndRecordDateBetween(account.getAccountId(), startOfMonth, endOfMonth);

        BigDecimal grossInterest = BigDecimal.ZERO;
        BigDecimal daysInYearBd = BigDecimal.valueOf(daysInYear);

        for (DailyBalance db : monthBalances) {
            // I_daily = (Balance × Rate) / DaysInYear
            BigDecimal dailyInterest = db.getClosingBalance()
                    .multiply(db.getAnnualInterestRate())
                    .divide(daysInYearBd, 6, RoundingMode.HALF_UP);
            grossInterest = grossInterest.add(dailyInterest);
        }

        if (grossInterest.compareTo(BigDecimal.ZERO) > 0) {
            // Withholding Tax = 10%
            BigDecimal tax = grossInterest.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal netInterest = grossInterest.subtract(tax).setScale(2, RoundingMode.HALF_UP);

            if (netInterest.compareTo(BigDecimal.ZERO) > 0) {
                account.setBalance(account.getBalance().add(netInterest));
                accountRepository.save(account);

                Transaction transaction = new Transaction();
                transaction.setAccount(account);
                transaction.setTransactionType("INTEREST_CREDIT");
                transaction.setAmount(netInterest);
                transaction.setBalanceAfter(account.getBalance());
                transaction.setProcessedBy(SYSTEM_USER_ID);
                transactionRepository.save(transaction);
            }
        }
    }
}
