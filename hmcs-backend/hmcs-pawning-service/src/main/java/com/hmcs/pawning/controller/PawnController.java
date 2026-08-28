package com.hmcs.pawning.controller;

import com.hmcs.pawning.dto.IssueTicketRequest;
import com.hmcs.pawning.dto.PawnTicketResponse;
import com.hmcs.pawning.service.PawnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pawning/tickets")
@RequiredArgsConstructor
public class PawnController {

    private final PawnService pawnService;
    private final com.hmcs.pawning.repository.PawnTicketRepository pawnTicketRepository;
    private final com.hmcs.pawning.repository.PawnPaymentRepository pawnPaymentRepository;

    @PostMapping
    public ResponseEntity<PawnTicketResponse> issueTicket(@RequestBody IssueTicketRequest request) {
        return ResponseEntity.ok(pawnService.issueTicket(request));
    }

    @GetMapping
    public ResponseEntity<List<PawnTicketResponse>> getAllTickets() {
        return ResponseEntity.ok(pawnService.getAllTickets());
    }

    @PreAuthorize("@pawningSecurityService.canAccessBranch(#branchId, authentication)")
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<PawnTicketResponse>> getTicketsByBranch(@PathVariable Integer branchId) {
        return ResponseEntity.ok(pawnService.getTicketsByBranch(branchId));
    }

    @PreAuthorize("@pawningSecurityService.canAccessTicket(#ticketId, authentication)")
    @GetMapping("/{ticketId}")
    public ResponseEntity<PawnTicketResponse> getTicket(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(pawnService.getTicket(ticketId));
    }

    @PreAuthorize("@pawningSecurityService.canAccessTicket(#ticketId, authentication)")
    @PostMapping("/{ticketId}/redeem")
    public ResponseEntity<PawnTicketResponse> redeemTicket(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(pawnService.redeemTicket(ticketId));
    }

    @PreAuthorize("@pawningSecurityService.canAccessTicket(#ticketId, authentication)")
    @PostMapping("/{ticketId}/approve")
    public ResponseEntity<PawnTicketResponse> approveTicket(
            @PathVariable UUID ticketId,
            @RequestBody java.util.Map<String, Object> request
    ) {
        java.math.BigDecimal assessedValue = new java.math.BigDecimal(request.get("assessedValue").toString());
        String remarks = request.containsKey("remarks") && request.get("remarks") != null 
                ? request.get("remarks").toString() : null;
        return ResponseEntity.ok(pawnService.approveTicket(ticketId, assessedValue, remarks));
    }

    @PreAuthorize("@pawningSecurityService.canAccessTicket(#ticketId, authentication)")
    @PostMapping("/{ticketId}/disburse")
    public ResponseEntity<PawnTicketResponse> disburseTicket(
            @PathVariable UUID ticketId,
            @RequestBody java.util.Map<String, Object> request
    ) {
        java.math.BigDecimal advanceAmount = new java.math.BigDecimal(request.get("advanceAmount").toString());
        return ResponseEntity.ok(pawnService.disburseTicket(ticketId, advanceAmount));
    }

    @PreAuthorize("@pawningSecurityService.canAccessTicket(#ticketId, authentication)")
    @PostMapping("/{ticketId}/payments")
    public ResponseEntity<PawnTicketResponse> makePayment(
            @PathVariable UUID ticketId,
            @RequestBody java.util.Map<String, Object> request
    ) {
        java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
        java.time.LocalDate date = request.containsKey("date") && request.get("date") != null 
                ? java.time.LocalDate.parse(request.get("date").toString()) 
                : java.time.LocalDate.now();
        return ResponseEntity.ok(pawnService.makePayment(ticketId, amount, date));
    }

    @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'PLATFORM_ADMIN', 'MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'SENIOR_OFFICER')")
    @PostMapping("/transactions/{id}/edit")
    public ResponseEntity<?> editTransaction(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, Object> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        java.math.BigDecimal newAmount = new java.math.BigDecimal(request.get("newAmount").toString());
        String reason = request.get("reason").toString();
        
        String managerId = "SYSTEM";
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            managerId = auth.getName();
        }
        
        pawnService.editTransactionAndRebuildLedger(id, newAmount, reason, managerId);
        return ResponseEntity.ok(java.util.Collections.singletonMap("success", true));
    }

    @PreAuthorize("@pawningSecurityService.canAccessBranch(#branchId, authentication)")
    @GetMapping("/transactions/branch/{branchId}")
    public ResponseEntity<?> getTransactionsByBranch(@PathVariable Integer branchId) {
        List<com.hmcs.pawning.entity.PawnTicket> tickets = pawnTicketRepository.findByBranchIdOrderByIssueDateDesc(branchId);
        List<java.util.Map<String, Object>> txs = new java.util.ArrayList<>();
        
        for (com.hmcs.pawning.entity.PawnTicket t : tickets) {
            java.util.Map<String, Object> issueTx = new java.util.HashMap<>();
            issueTx.put("transactionId", t.getTicketId());
            issueTx.put("transactionType", "PAWN_ISSUE");
            issueTx.put("amount", t.getAdvanceAmount());
            issueTx.put("transactionTimestamp", t.getIssueDate() != null ? t.getIssueDate().atStartOfDay() : java.time.LocalDateTime.now());
            issueTx.put("reference", t.getTicketNumber());
            issueTx.put("processedBy", t.getMemberId());
            issueTx.put("balanceAfter", t.getAdvanceAmount());
            txs.add(issueTx);
            
            List<com.hmcs.pawning.entity.PawnPayment> payments = pawnPaymentRepository.findByTicketIdOrderByPaymentDateDesc(t.getTicketId());
            for (com.hmcs.pawning.entity.PawnPayment p : payments) {
                java.util.Map<String, Object> payTx = new java.util.HashMap<>();
                payTx.put("transactionId", p.getPaymentId() != null ? p.getPaymentId() : UUID.randomUUID());
                payTx.put("transactionType", "PAWN_REPAYMENT");
                payTx.put("amount", p.getPaymentAmount());
                payTx.put("transactionTimestamp", p.getPaymentDate() != null ? p.getPaymentDate() : java.time.LocalDateTime.now());
                payTx.put("reference", t.getTicketNumber());
                payTx.put("processedBy", t.getMemberId());
                payTx.put("balanceAfter", java.math.BigDecimal.ZERO);
                txs.add(payTx);
            }
        }
        txs.sort((a, b) -> ((java.time.LocalDateTime)b.get("transactionTimestamp")).compareTo((java.time.LocalDateTime)a.get("transactionTimestamp")));
        return ResponseEntity.ok(txs);
    }
}
