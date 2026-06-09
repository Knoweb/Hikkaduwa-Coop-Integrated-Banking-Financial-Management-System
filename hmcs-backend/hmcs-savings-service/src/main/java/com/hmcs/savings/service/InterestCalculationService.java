package com.hmcs.savings.service;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.DailyBalance;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.DailyBalanceRepository;
import com.hmcs.savings.repository.TransactionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class InterestCalculationService {
    
    private final AccountRepository accountRepository;
    private final DailyBalanceRepository dailyBalanceRepository;
    private final TransactionRepository transactionRepository;

    // A UUID to represent the "SYSTEM" user for automated transactions
    private final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    public InterestCalculationService(AccountRepository accountRepository, 
                                      DailyBalanceRepository dailyBalanceRepository, 
                                      TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.dailyBalanceRepository = dailyBalanceRepository;
        this.transactionRepository = transactionRepository;
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
            // 1. Save Daily Snapshot
            DailyBalance snapshot = new DailyBalance();
            snapshot.setAccountId(account.getAccountId());
            snapshot.setRecordDate(today);
            snapshot.setClosingBalance(account.getBalance());
            snapshot.setAnnualInterestRate(account.getAnnualInterestRate() != null ? account.getAnnualInterestRate() : new BigDecimal("0.0600"));
            dailyBalanceRepository.save(snapshot);

            // 2. Check if it's the last day of the month
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
            // I_daily = (B * R) / Y
            BigDecimal dailyInterest = db.getClosingBalance()
                    .multiply(db.getAnnualInterestRate())
                    .divide(daysInYearBd, 6, RoundingMode.HALF_UP);
            grossInterest = grossInterest.add(dailyInterest);
        }

        if (grossInterest.compareTo(BigDecimal.ZERO) > 0) {
            // T = I_gross * 0.10
            BigDecimal tax = grossInterest.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
            
            // I_net = I_gross - T
            BigDecimal netInterest = grossInterest.subtract(tax).setScale(2, RoundingMode.HALF_UP);

            if (netInterest.compareTo(BigDecimal.ZERO) > 0) {
                // Credit to account
                account.setBalance(account.getBalance().add(netInterest));
                accountRepository.save(account);

                // Record transaction
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
