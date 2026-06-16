package com.hmcs.loan.controller;

import com.hmcs.loan.entity.Loan;
import com.hmcs.loan.entity.LoanApprovalAction;
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
    public List<Loan> getAllLoans() {
        return loanService.getAllLoans();
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
            @RequestParam BigDecimal annualRate) {
        List<Map<String, Object>> schedule = loanService.generateRepaymentSchedule(principal, termMonths, annualRate);
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
}
