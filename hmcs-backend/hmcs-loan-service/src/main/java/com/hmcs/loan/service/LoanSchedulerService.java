package com.hmcs.loan.service;

import com.hmcs.loan.entity.Loan;
import com.hmcs.loan.entity.LoanSchedule;
import com.hmcs.loan.repository.LoanRepository;
import com.hmcs.loan.repository.LoanScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LoanSchedulerService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanScheduleRepository loanScheduleRepository;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Runs every day at 23:59 to mark overdue loan installments.
     */
    @Scheduled(cron = "0 59 23 * * ?")
    @Transactional
    public void scheduledProcessLoans() {
        processLoansForDate(LocalDate.now());
        
        logSchedulerExecution("EOD_LOAN", LocalDateTime.now(), "SUCCESS", "Processed Overdue Loans");
    }

    @PostConstruct
    @Transactional
    public void catchUpMissingLoans() {
        processLoansForDate(LocalDate.now());
        System.out.println("[LoanSchedulerService] Initialized and processed overdue loans on startup.");
    }

    public void processLoansForDate(LocalDate date) {
        List<LoanSchedule> pendingSchedules = loanScheduleRepository.findByStatusOrderByInstallmentNumberAsc(LoanSchedule.ScheduleStatus.PENDING).stream()
            .filter(s -> s.getDueDate().isBefore(date))
            .toList();

        for (LoanSchedule schedule : pendingSchedules) {
            schedule.setStatus(LoanSchedule.ScheduleStatus.OVERDUE);
            loanScheduleRepository.save(schedule);
        }
        
        System.out.println("[LoanSchedulerService] Marked " + pendingSchedules.size() + " installments as OVERDUE.");
    }

    private void logSchedulerExecution(String taskName, LocalDateTime executionTime, String status, String details) {
        Map<String, Object> logPayload = new HashMap<>();
        logPayload.put("taskName", taskName);
        logPayload.put("executionTime", executionTime.toString());
        logPayload.put("status", status);
        logPayload.put("details", details);

        try {
            String savingsServiceUrl = "http://hmcs-savings-service:8082/api/v1/savings/internal/scheduler-logs";
            restTemplate.postForEntity(savingsServiceUrl, logPayload, String.class);
        } catch (Exception e) {
            System.err.println("[LoanSchedulerService] Failed to log scheduler execution to Savings Service: " + e.getMessage());
        }
    }
}
