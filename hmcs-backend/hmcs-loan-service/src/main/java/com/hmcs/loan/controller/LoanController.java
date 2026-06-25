package com.hmcs.loan.controller;

import com.hmcs.loan.entity.Loan;
import com.hmcs.loan.entity.LoanApprovalAction;
import com.hmcs.loan.entity.LoanSchedule;
import com.hmcs.loan.entity.LoanRepayment;
import com.hmcs.loan.service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

    // ── Apply ────────────────────────────────────────────────────────────────
    @PostMapping("/apply/{loanTypeId}")
    public ResponseEntity<Loan> applyForLoan(@PathVariable UUID loanTypeId, @RequestBody Loan loanRequest) {
        try {
            Loan createdLoan = loanService.applyForLoan(loanRequest, loanTypeId);
            return ResponseEntity.ok(createdLoan);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ── Queries ──────────────────────────────────────────────────────────────
    @GetMapping
    public List<Loan> getAllLoans(@RequestParam(required = false) Integer branchId) {
        return loanService.getAllLoans(branchId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Loan> getLoanById(@PathVariable UUID id) {
        return loanService.getLoanById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/member/{memberId}")
    public List<Loan> getLoansByMemberId(@PathVariable UUID memberId) {
        return loanService.getLoansByMemberId(memberId);
    }

    @GetMapping("/status/{status}")
    public List<Loan> getLoansByStatus(@PathVariable String status) {
        return loanService.getLoansByStatus(status);
    }

    // ── Stage (legacy) ───────────────────────────────────────────────────────
    @PatchMapping("/{id}/stage")
    public ResponseEntity<Loan> updateLoanStage(
            @PathVariable UUID id,
            @RequestParam String stage,
            @RequestParam(required = false) String status) {
        try {
            Loan updated = loanService.updateLoanStage(id, stage, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Approval Workflow ────────────────────────────────────────────────────

    /**
     * Advance loan to the next workflow stage.
     * Body: { "actorUsername": "mgr_hkw", "actorRole": "BRANCH_MANAGER", "comments": "..." }
     */
    @PostMapping("/{id}/advance")
    public ResponseEntity<Loan> advanceLoanStage(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            Loan updated = loanService.advanceLoanStage(
                    id,
                    body.getOrDefault("actorUsername", "system"),
                    body.getOrDefault("actorRole", "UNKNOWN"),
                    body.getOrDefault("comments", "")
            );
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Reject a loan at the current stage.
     * Body: { "actorUsername": "mgr_hkw", "actorRole": "BRANCH_MANAGER", "comments": "Reason..." }
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Loan> rejectLoan(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            Loan updated = loanService.rejectLoan(
                    id,
                    body.getOrDefault("actorUsername", "system"),
                    body.getOrDefault("actorRole", "UNKNOWN"),
                    body.getOrDefault("comments", "")
            );
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Disburse an approved loan.
     * Body: { "amount": 100000, "actorUsername": "mgr_hkw" }
     */
    @PostMapping("/{id}/disburse")
    public ResponseEntity<Loan> disburseLoan(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = body.containsKey("amount") ? new BigDecimal(body.get("amount").toString()) : null;
            String actorUsername = body.getOrDefault("actorUsername", "system").toString();
            String paymentMethod = body.getOrDefault("paymentMethod", "CASH").toString();
            String savingsAccountNumber = body.getOrDefault("savingsAccountNumber", "").toString();
            
            Loan updated = loanService.disburseLoan(id, amount, actorUsername, paymentMethod, savingsAccountNumber);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Get full approval history for a loan.
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<LoanApprovalAction>> getLoanHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(loanService.getLoanApprovalHistory(id));
    }

    // ── EMI & Schedule ───────────────────────────────────────────────────────

    /**
     * Generate repayment schedule.
     * Query params: principal, termMonths, annualRate
     */
    @GetMapping("/schedule")
    public ResponseEntity<List<Map<String, Object>>> getRepaymentSchedule(
            @RequestParam BigDecimal principal,
            @RequestParam Integer termMonths,
            @RequestParam BigDecimal annualRate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate) {
        List<Map<String, Object>> schedule = loanService.generateRepaymentSchedule(principal, termMonths, annualRate, startDate);
        return ResponseEntity.ok(schedule);
    }

    /**
     * Calculate interest for given principal, days, rate.
     */
    @GetMapping("/calculate-interest")
    public ResponseEntity<Map<String, Object>> calculateInterest(
            @RequestParam BigDecimal principal,
            @RequestParam int days,
            @RequestParam BigDecimal rate) {
        BigDecimal interest = loanService.calculateInterest(principal, days, rate);
        return ResponseEntity.ok(Map.of(
                "principal", principal,
                "days", days,
                "rate", rate,
                "interest", interest,
                "formula", "(" + principal + " × " + days + " × " + rate + "%) ÷ 36,500"
        ));
    }

    /**
     * Get the saved repayment schedule for a specific loan.
     */
    @GetMapping("/{id}/saved-schedule")
    public ResponseEntity<List<LoanSchedule>> getSavedSchedule(@PathVariable UUID id) {
        return ResponseEntity.ok(loanService.getLoanSchedules(id));
    }

    /**
     * Get the repayment history for a specific loan.
     */
    @GetMapping("/{id}/repayments")
    public ResponseEntity<List<LoanRepayment>> getRepayments(@PathVariable UUID id) {
        return ResponseEntity.ok(loanService.getLoanRepayments(id));
    }

    /**
     * Process a loan installment repayment.
     * Body: { "amount": 10500, "paymentMethod": "CASH", "reference": "Ref123", "actorUsername": "mgr_hkw", "paymentBranchId": 2 }
     */
    @PostMapping("/{id}/repay")
    public ResponseEntity<?> repayInstallment(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String paymentMethod = body.getOrDefault("paymentMethod", "CASH").toString();
            String reference = body.getOrDefault("reference", "").toString();
            String actorUsername = body.getOrDefault("actorUsername", "system").toString();
            Long paymentBranchId = null;
            if (body.containsKey("paymentBranchId") && body.get("paymentBranchId") != null) {
                paymentBranchId = Long.valueOf(body.get("paymentBranchId").toString());
            }
            java.time.LocalDate paymentDate = null;
            if (body.containsKey("paymentDate") && body.get("paymentDate") != null) {
                paymentDate = java.time.LocalDate.parse(body.get("paymentDate").toString());
            }

            LoanRepayment repayment = loanService.payInstallment(id, amount, paymentMethod, reference, actorUsername, paymentBranchId, paymentDate);
            return ResponseEntity.ok(repayment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
