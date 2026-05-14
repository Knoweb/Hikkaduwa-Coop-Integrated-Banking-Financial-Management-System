package com.hmcs.account.controller;

import com.hmcs.account.dto.MemberRegistrationRequest;
import com.hmcs.account.dto.SavingsAccountRequest;
import com.hmcs.account.entity.Member;
import com.hmcs.account.entity.SavingsAccount;
import com.hmcs.account.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@CrossOrigin(origins = "*", maxAge = 3600)
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

    @PostMapping("/members/register")
    public ResponseEntity<?> registerMember(@RequestBody MemberRegistrationRequest request) {
        try {
            Long branchId = getCurrentBranchId();
            Member newMember = accountService.registerMember(request, branchId);
            return ResponseEntity.ok(newMember);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/savings/open")
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
}
