package com.hmcs.loan.controller;

import com.hmcs.loan.dto.MemberRegistrationRequest;
import com.hmcs.loan.dto.SavingsAccountRequest;
import com.hmcs.loan.entity.Member;
import com.hmcs.loan.entity.SavingsAccount;
import com.hmcs.loan.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class MemberController {

    @Autowired
    private AccountService accountService;

    // Helper to get branch ID from JWT token via Security Context
    private Long getCurrentBranchId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Long) {
            return (Long) auth.getDetails();
        }
        throw new RuntimeException("Unauthorized or missing branch context.");
    }

    @PostMapping("/members")
    public ResponseEntity<?> registerMember(@RequestBody MemberRegistrationRequest request) {
        try {
            Long branchId = getCurrentBranchId();
            Member newMember = accountService.registerMember(request, branchId);
            return ResponseEntity.ok(newMember);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/members/search")
    public ResponseEntity<List<Member>> searchMembers(@RequestParam("q") String query) {
        Long branchId = getCurrentBranchId();
        return ResponseEntity.ok(accountService.searchMembers(branchId, query));
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> openSavingsAccount(@RequestBody SavingsAccountRequest request) {
        try {
            Long branchId = getCurrentBranchId();
            SavingsAccount newAccount = accountService.openSavingsAccount(request, branchId);
            return ResponseEntity.ok(newAccount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/members")
    public ResponseEntity<List<Member>> getBranchMembers() {
        Long branchId = getCurrentBranchId();
        return ResponseEntity.ok(accountService.getMembersByBranch(branchId));
    }
    
    @GetMapping("/savings")
    public ResponseEntity<List<SavingsAccount>> getBranchAccounts() {
        Long branchId = getCurrentBranchId();
        return ResponseEntity.ok(accountService.getAccountsByBranch(branchId));
    }

    @PostMapping("/transactions/deposit")
    public ResponseEntity<?> processDeposit(@RequestBody com.hmcs.loan.dto.TransactionRequest request) {
        try {
            Long branchId = getCurrentBranchId();
            SavingsAccount account = accountService.processDeposit(request, branchId);
            return ResponseEntity.ok(account);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/transactions/withdraw")
    public ResponseEntity<?> processWithdraw(@RequestBody com.hmcs.loan.dto.TransactionRequest request) {
        try {
            Long branchId = getCurrentBranchId();
            SavingsAccount account = accountService.processWithdraw(request, branchId);
            return ResponseEntity.ok(account);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

