package com.hmcs.loan.service;

import com.hmcs.loan.entity.Loan;
import com.hmcs.loan.entity.LoanApprovalAction;
import com.hmcs.loan.entity.LoanType;
import com.hmcs.loan.repository.LoanApprovalActionRepository;
import com.hmcs.loan.repository.LoanRepository;
import com.hmcs.loan.repository.LoanTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class LoanService {

    // Workflow stages in order
    public static final List<String> WORKFLOW_STAGES = List.of(
        "STAGE_1_APPLICATION_SUBMITTED",
        "STAGE_2_FIELD_OFFICER_VERIFICATION",
        "STAGE_3_REGIONAL_COMMITTEE",
        "STAGE_4_BRANCH_MANAGER_RECOMMENDATION",
        "STAGE_5_BANK_SERVICE_MANAGER",
        "STAGE_6_LOAN_COMMITTEE_VOTE",
        "STAGE_7_CHAIRMAN_SECRETARY_SIGNATURE",
        "STAGE_8_DISBURSEMENT"
    );

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanTypeRepository loanTypeRepository;

    @Autowired
    private LoanApprovalActionRepository approvalActionRepository;

    // ── Apply ──────────────────────────────────────────────────────────────────
    public Loan applyForLoan(Loan loanRequest, UUID loanTypeId) {
        LoanType type = loanTypeRepository.findById(loanTypeId)
                .orElseThrow(() -> new RuntimeException("Loan Type not found"));

        loanRequest.setLoanType(type);
        loanRequest.setInterestRate(type.getInterestRate());
        loanRequest.setAppliedDate(LocalDate.now());
        loanRequest.setStatus("PENDING");
        loanRequest.setCurrentStage("STAGE_1_APPLICATION_SUBMITTED");

        return loanRepository.save(loanRequest);
    }

    // ── Getters ────────────────────────────────────────────────────────────────
    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    public Optional<Loan> getLoanById(UUID id) {
        return loanRepository.findById(id);
    }

    public List<Loan> getLoansByMemberId(UUID memberId) {
        return loanRepository.findByMemberId(memberId);
    }

    public List<Loan> getLoansByStatus(String status) {
        return loanRepository.findByStatus(status);
    }

    // ── Stage Management ───────────────────────────────────────────────────────
    public Loan updateLoanStage(UUID loanId, String newStage, String newStatus) {
        return loanRepository.findById(loanId).map(loan -> {
            loan.setCurrentStage(newStage);
            if (newStatus != null) {
                loan.setStatus(newStatus);
            }
            return loanRepository.save(loan);
        }).orElseThrow(() -> new RuntimeException("Loan not found with id " + loanId));
    }

    /**
     * Advance loan to next workflow stage.
     * Records an approval action for audit trail.
     */
    public Loan advanceLoanStage(UUID loanId, String actorUsername, String actorRole, String comments) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        String currentStage = loan.getCurrentStage();
        int currentIdx = WORKFLOW_STAGES.indexOf(currentStage);

        if (currentIdx < 0) {
            throw new RuntimeException("Unknown current stage: " + currentStage);
        }
        if (currentIdx >= WORKFLOW_STAGES.size() - 1) {
            throw new RuntimeException("Loan is already at the final stage");
        }

        String nextStage = WORKFLOW_STAGES.get(currentIdx + 1);
        loan.setCurrentStage(nextStage);

        // Mark as APPROVED when reaching disbursement
        if (nextStage.equals("STAGE_8_DISBURSEMENT")) {
            loan.setStatus("APPROVED");
        }

        loanRepository.save(loan);

        // Record audit action
        LoanApprovalAction action = new LoanApprovalAction();
        action.setLoanId(loanId);
        action.setStage(currentStage);
        action.setAction("APPROVED");
        action.setActorUsername(actorUsername);
        action.setActorRole(actorRole);
        action.setComments(comments);
        approvalActionRepository.save(action);

        return loan;
    }

    /**
     * Reject a loan at any stage.
     */
    public Loan rejectLoan(UUID loanId, String actorUsername, String actorRole, String comments) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        String currentStage = loan.getCurrentStage();
        loan.setStatus("REJECTED");
        loanRepository.save(loan);

        LoanApprovalAction action = new LoanApprovalAction();
        action.setLoanId(loanId);
        action.setStage(currentStage);
        action.setAction("REJECTED");
        action.setActorUsername(actorUsername);
        action.setActorRole(actorRole);
        action.setComments(comments);
        approvalActionRepository.save(action);

        return loan;
    }

    /**
     * Get approval history for a loan.
     */
    public List<LoanApprovalAction> getLoanApprovalHistory(UUID loanId) {
        return approvalActionRepository.findByLoanIdOrderByCreatedAtAsc(loanId);
    }

    // ── EMI & Interest Calculations ────────────────────────────────────────────

    /**
     * Calculate interest using formula: (Principal × Days × Rate%) ÷ 36,500
     */
    public BigDecimal calculateInterest(BigDecimal principal, int days, BigDecimal ratePercent) {
        // Interest = (Principal × Days × Rate%) ÷ 36,500
        return principal
                .multiply(BigDecimal.valueOf(days))
                .multiply(ratePercent)
                .divide(BigDecimal.valueOf(36500), 2, RoundingMode.HALF_UP);
    }

    /**
     * Generate monthly EMI repayment schedule.
     * EMI = Principal ÷ termMonths (simple, principal-only monthly)
     * Interest is calculated separately per installment on outstanding balance.
     */
    public List<Map<String, Object>> generateRepaymentSchedule(BigDecimal principal, Integer termMonths, BigDecimal annualRatePercent) {
        List<Map<String, Object>> schedule = new ArrayList<>();

        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        BigDecimal dailyRate = annualRatePercent.divide(BigDecimal.valueOf(36500), 10, RoundingMode.HALF_UP);
        BigDecimal outstandingBalance = principal;

        LocalDate dueDate = LocalDate.now().plusMonths(1);

        for (int i = 1; i <= termMonths; i++) {
            // Interest for 30 days on outstanding balance
            BigDecimal interestAmount = outstandingBalance
                    .multiply(dailyRate)
                    .multiply(BigDecimal.valueOf(30))
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal emi = monthlyPrincipal.add(interestAmount);
            outstandingBalance = outstandingBalance.subtract(monthlyPrincipal);
            if (outstandingBalance.compareTo(BigDecimal.ZERO) < 0) {
                outstandingBalance = BigDecimal.ZERO;
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("installmentNo", i);
            row.put("dueDate", dueDate.toString());
            row.put("principalPortion", monthlyPrincipal);
            row.put("interestPortion", interestAmount);
            row.put("emi", emi);
            row.put("outstandingBalance", outstandingBalance);
            schedule.add(row);

            dueDate = dueDate.plusMonths(1);
        }

        return schedule;
    }
}
