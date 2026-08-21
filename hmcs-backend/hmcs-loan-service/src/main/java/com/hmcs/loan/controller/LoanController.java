package com.hmcs.loan.controller;

import com.hmcs.loan.entity.Loan;
import com.hmcs.loan.entity.LoanApprovalAction;
import com.hmcs.loan.entity.LoanSchedule;
import com.hmcs.loan.entity.LoanRepayment;
import com.hmcs.loan.service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import com.hmcs.loan.security.JwtUtil;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;
    
    @Autowired
    private com.hmcs.loan.repository.LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // ── Apply ────────────────────────────────────────────────────────────────
    @PostMapping("/apply/{loanTypeId}")
    public ResponseEntity<Loan> applyForLoan(@PathVariable UUID loanTypeId, @RequestBody Loan loanRequest) {
        Loan createdLoan = loanService.applyForLoan(loanRequest, loanTypeId);
        return ResponseEntity.ok(createdLoan);
    }

    // ── Queries ──────────────────────────────────────────────────────────────
    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER', 'FIELD_OFFICER')")
    public List<Loan> getAllLoans(@RequestParam(required = false) Integer branchId, HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            Integer userBranchId = jwtUtil.extractBranchId(token);
            String role = jwtUtil.extractRole(token);
            
            if (role != null && !role.equals("ADMIN") && !role.equals("SYSTEM_ADMIN")) {
                if (branchId == null) {
                    branchId = userBranchId;
                } else if (!branchId.equals(userBranchId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Unauthorized branch access");
                }
            }
        }
        return loanService.getAllLoans(branchId);
    }

    @GetMapping("/reports/insurance")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')")
    public List<Loan> getInsuranceReportLoans(@RequestParam String month, @RequestParam(required = false) Integer branchId, HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            Integer userBranchId = jwtUtil.extractBranchId(token);
            String role = jwtUtil.extractRole(token);
            if (role != null && !role.equals("ADMIN") && !role.equals("SYSTEM_ADMIN")) {
                if (branchId == null) {
                    branchId = userBranchId;
                } else if (!branchId.equals(userBranchId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Unauthorized branch access");
                }
            }
        }
        return loanService.getInsuranceReportLoans(month, branchId);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLoan(@PathVariable UUID id) {
        try {
            loanService.deleteLoan(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    
    // ── Field Officer Operations ─────────────────────────────────────────────
    @PostMapping("/{id}/assign-evaluator")
    public ResponseEntity<Loan> assignEvaluator(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            UUID evaluatorId = UUID.fromString(body.get("evaluatorId"));
            Loan updated = loanService.assignEvaluator(id, evaluatorId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<Loan> submitEvaluation(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.get("evaluationStatus");
            String notes = body.get("evaluationNotes");
            Loan updated = loanService.submitEvaluation(id, status, notes);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/evaluator/{evaluatorId}")
    public List<Loan> getLoansByEvaluator(@PathVariable UUID evaluatorId) {
        return loanService.getLoansByEvaluatorId(evaluatorId);
    }

    // ── Approval Workflow ────────────────────────────────────────────────────

    /**
     * Advance loan to the next workflow stage.
     * Body: { "actorUsername": "mgr_hkw", "actorRole": "BRANCH_MANAGER", "comments": "..." }
     */
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')")
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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')")
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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER')")
    @PostMapping("/{id}/disburse")
    public ResponseEntity<?> disburseLoan(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = body.containsKey("amount") ? new BigDecimal(body.get("amount").toString()) : null;
            String actorUsername = body.getOrDefault("actorUsername", "system").toString();
            String paymentMethod = body.getOrDefault("paymentMethod", "CASH").toString();
            String savingsAccountNumber = body.getOrDefault("savingsAccountNumber", "").toString();
            String loanAccountNumber = body.getOrDefault("loanAccountNumber", "").toString();
            
            Loan updated = loanService.disburseLoan(id, amount, actorUsername, paymentMethod, savingsAccountNumber, loanAccountNumber);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
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

    public static class EditRepaymentRequest {
        public BigDecimal newAmount;
        public String reason;
    }

    // ── Edit Transaction ─────────────────────────────────────────────────────
    @PostMapping("/transactions/{id}/edit")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<?> editTransaction(
            @PathVariable UUID id,
            @RequestBody EditRepaymentRequest body,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            String actorUsername = "mgr_hkw";
            if (org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null) {
                actorUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            }
            loanService.editRepaymentAndRebuildLedger(id, body.newAmount, body.reason, actorUsername);
            return ResponseEntity.ok(Map.of("message", "Loan transaction updated and ledger rebuilt successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Field Collection ─────────────────────────────────────────────────────
    @PostMapping("/field-collection/collect")
    public ResponseEntity<?> recordFieldCollection(@RequestBody Map<String, Object> body) {
        try {
            UUID loanId = UUID.fromString(body.get("loanId").toString());
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String username = body.getOrDefault("username", "system").toString();
            Long branchId = body.containsKey("branchId") && body.get("branchId") != null ? Long.valueOf(body.get("branchId").toString()) : 1L;

            com.hmcs.loan.entity.PendingFieldCollection pfc = loanService.recordFieldCollection(loanId, amount, username, branchId);
            return ResponseEntity.ok(pfc);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/field-collection/pending/{branchId}")
    public ResponseEntity<?> getPendingFieldCollections(@PathVariable Long branchId) {
        List<com.hmcs.loan.entity.PendingFieldCollection> pending = loanService.getPendingFieldCollections(branchId);
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/field-collection/history/{username}")
    public ResponseEntity<?> getFieldCollectionHistory(@PathVariable String username) {
        List<com.hmcs.loan.entity.PendingFieldCollection> history = loanService.getFieldCollectionHistory(username);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/field-collection/balance/{username}")
    public ResponseEntity<Map<String, BigDecimal>> getFieldCollectionBalance(@PathVariable String username) {
        BigDecimal balance = loanService.getFieldCollectionBalance(username);
        return ResponseEntity.ok(Map.of("balance", balance));
    }

    @PostMapping("/field-collection/handover")
    public ResponseEntity<?> handoverFieldCash(@RequestBody Map<String, Object> body) {
        try {
            String fieldOfficerUsername = body.get("fieldOfficerUsername").toString();
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String tellerUsername = body.getOrDefault("tellerUsername", "system").toString();
            Integer branchId = body.containsKey("branchId") && body.get("branchId") != null ? 
                    Integer.valueOf(body.get("branchId").toString()) : 1;
                    
            loanService.handoverFieldCash(fieldOfficerUsername, amount, tellerUsername, branchId);
            return ResponseEntity.ok(Map.of("message", "Handover successful"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/field-collection/handover/{id}")
    public ResponseEntity<?> handoverSingleFieldCash(@PathVariable java.util.UUID id, @RequestBody Map<String, Object> body) {
        try {
            String tellerUsername = body.containsKey("tellerUsername") && body.get("tellerUsername") != null 
                    ? body.get("tellerUsername").toString() : "system";
            Integer branchId = body.containsKey("branchId") && body.get("branchId") != null 
                    ? Integer.valueOf(body.get("branchId").toString()) : 1;
                    
            loanService.handoverSingleFieldCash(id, tellerUsername, branchId);
            return ResponseEntity.ok(Map.of("message", "Individual handover successful"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/transactions/branch/{branchId}")
    public ResponseEntity<?> getTransactionsByBranch(@PathVariable Integer branchId) {
        List<com.hmcs.loan.entity.LedgerEntry> ledgers = ledgerEntryRepository.findByBranchIdOrderByEntryDateDesc(branchId);
        List<Map<String, Object>> txs = new java.util.ArrayList<>();
        for (com.hmcs.loan.entity.LedgerEntry l : ledgers) {
            if ("DISBURSEMENT".equals(l.getEntryType()) || "REPAYMENT_CASH_IN".equals(l.getEntryType())) {
                Map<String, Object> tx = new java.util.HashMap<>();
                tx.put("transactionId", l.getEntryId());
                tx.put("transactionType", "DISBURSEMENT".equals(l.getEntryType()) ? "LOAN_DISBURSEMENT" : "LOAN_REPAYMENT");
                tx.put("amount", l.getAmount());
                tx.put("transactionTimestamp", l.getCreatedAt() != null ? l.getCreatedAt() : l.getEntryDate().atStartOfDay());
                tx.put("reference", l.getReferenceNumber());
                tx.put("processedBy", l.getCreatedBy());
                tx.put("balanceAfter", java.math.BigDecimal.ZERO);
                txs.add(tx);
            }
        }
        return ResponseEntity.ok(txs);
    }
}
