package com.hmcs.pawning.controller;

import com.hmcs.pawning.dto.IssueTicketRequest;
import com.hmcs.pawning.dto.PawnTicketResponse;
import com.hmcs.pawning.service.PawnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pawning/tickets")
@RequiredArgsConstructor
@CrossOrigin("*")
public class PawnController {

    private final PawnService pawnService;

    @PostMapping
    public ResponseEntity<PawnTicketResponse> issueTicket(@RequestBody IssueTicketRequest request) {
        return ResponseEntity.ok(pawnService.issueTicket(request));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<PawnTicketResponse>> getTicketsByBranch(@PathVariable Integer branchId) {
        return ResponseEntity.ok(pawnService.getTicketsByBranch(branchId));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<PawnTicketResponse> getTicket(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(pawnService.getTicket(ticketId));
    }

    @PostMapping("/{ticketId}/redeem")
    public ResponseEntity<PawnTicketResponse> redeemTicket(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(pawnService.redeemTicket(ticketId));
    }

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
}
