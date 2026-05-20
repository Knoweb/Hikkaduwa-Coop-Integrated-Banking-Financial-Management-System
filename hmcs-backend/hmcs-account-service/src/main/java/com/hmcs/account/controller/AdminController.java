package com.hmcs.account.controller;

import com.hmcs.account.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired
    private AccountService accountService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('GENERAL_MANAGER')")
    public ResponseEntity<Map<String, Object>> getGlobalSummary() {
        return ResponseEntity.ok(accountService.getGlobalSummary());
    }
}
