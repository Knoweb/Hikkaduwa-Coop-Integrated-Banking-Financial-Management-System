package com.hmcs.savings.service;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.entity.FixedDeposit;
import com.hmcs.savings.entity.FixedDepositType;
import com.hmcs.savings.entity.Transaction;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.FixedDepositRepository;
import com.hmcs.savings.repository.FixedDepositTypeRepository;
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
public class FixedDepositInterestService {

    private final FixedDepositRepository fdRepository;
    private final FixedDepositTypeRepository typeRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    private final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    public FixedDepositInterestService(FixedDepositRepository fdRepository,
                                       FixedDepositTypeRepository typeRepository,
                                       AccountRepository accountRepository,
                                       TransactionRepository transactionRepository) {
        this.fdRepository = fdRepository;
        this.typeRepository = typeRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Runs every day at 23:59 to accrue FD interest, process monthly payouts, and handle maturities.
     */
    @Scheduled(cron = "0 59 23 * * ?")
    @Transactional
    public void processFixedDeposits() {
        LocalDate today = LocalDate.now();
        List<FixedDeposit> activeFDs = fdRepository.findByStatus("ACTIVE");

        int daysInYear = Year.isLeap(today.getYear()) ? 366 : 365;
        BigDecimal daysInYearBd = BigDecimal.valueOf(daysInYear);
        BigDecimal hundred = BigDecimal.valueOf(100);

        for (FixedDeposit fd : activeFDs) {
            // 1. Daily Accrual
            // Daily Interest = Principal * (Rate / 100) / DaysInYear
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
                
                // If today is the monthly anniversary, or if it's maturing (final month payout)
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
                    // Reinvest Principal + Interest
                    // Note: If MONTHLY, accumulated is already 0 because it was paid out just above.
                    fd.setPrincipalAmount(fd.getPrincipalAmount().add(accumulated));
                    fd.setAccumulatedInterest(BigDecimal.ZERO);
                    
                } else if ("REINVEST_PRINCIPAL_ONLY".equals(instruction)) {
                    // Payout Interest, Reinvest Principal
                    if (accumulated.compareTo(BigDecimal.ZERO) > 0) {
                        creditToSavings(fd, accumulated, "FD_MATURITY_INTEREST");
                    }
                    fd.setAccumulatedInterest(BigDecimal.ZERO);
                    
                } else if ("CLOSE_AND_PAYOUT".equals(instruction)) {
                    // Payout Principal + Interest, Close FD
                    BigDecimal totalPayout = fd.getPrincipalAmount().add(accumulated);
                    if (totalPayout.compareTo(BigDecimal.ZERO) > 0) {
                        creditToSavings(fd, totalPayout, "FD_CLOSURE_PAYOUT");
                    }
                    fd.setAccumulatedInterest(BigDecimal.ZERO);
                    fd.setPrincipalAmount(BigDecimal.ZERO);
                    fd.setStatus("CLOSED");
                }

                // If renewing, update dates and interest rate
                if (!"CLOSED".equals(fd.getStatus())) {
                    fd.setOpenedDate(today);
                    fd.setLastInterestPayoutDate(today);
                    fd.setMaturityDate(today.plusMonths(fd.getTermMonths()));
                    
                    // Fetch current prevailing rate
                    if (fd.getTypeId() != null) {
                        FixedDepositType currentType = typeRepository.findById(fd.getTypeId()).orElse(null);
                        if (currentType != null) {
                            BigDecimal newRate = "MONTHLY".equals(fd.getInterestPayoutMethod()) 
                                    ? currentType.getInterestRateMonthly() 
                                    : currentType.getInterestRateMaturity();
                            fd.setInterestRate(newRate);
                        }
                    }
                }
            }

            fdRepository.save(fd);
        }
    }

    private void creditToSavings(FixedDeposit fd, BigDecimal amount, String transactionType) {
        if (fd.getLinkedSavingsAccountId() == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Account savingsAcc = accountRepository.findById(fd.getLinkedSavingsAccountId()).orElse(null);
        if (savingsAcc != null && "ACTIVE".equals(savingsAcc.getStatus())) {
            
            BigDecimal netAmount = amount;
            if (transactionType.contains("INTEREST") && Boolean.FALSE.equals(fd.getHasSubmittedTaxForm())) {
                // Deduct 10% Withholding Tax if tax form is not submitted
                BigDecimal tax = amount.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
                netAmount = amount.subtract(tax).setScale(2, RoundingMode.HALF_UP);
            }

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
