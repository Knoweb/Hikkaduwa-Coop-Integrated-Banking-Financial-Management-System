package com.hmcs.auth.controller;

import com.hmcs.auth.entity.Organization;
import com.hmcs.auth.repository.OrganizationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public OrganizationController(OrganizationRepository organizationRepository, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.organizationRepository = organizationRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(organizationRepository.findByOrganizationIdGreaterThan(0));
    }

    @PostMapping
    public ResponseEntity<?> createOrganization(@RequestBody java.util.Map<String, String> request) {
        String name = request.get("name");
        String subdomain = request.get("subdomain");
        String branchName = request.get("branchName");
        String adminUsername = request.get("adminUsername");
        String adminPassword = request.get("adminPassword");

        if (subdomain == null || subdomain.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Subdomain is required");
        }
        
        Optional<Organization> existing = organizationRepository.findBySubdomain(subdomain.toLowerCase().trim());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Subdomain already exists");
        }

        // Save Organization
        Organization org = new Organization();
        org.setName(name);
        org.setSubdomain(subdomain.toLowerCase().trim());
        org.setStatus("ACTIVE");
        org.setCreatedAt(LocalDateTime.now());
        Organization saved = organizationRepository.save(org);
        
        Integer tenantId = saved.getOrganizationId();

        // Insert Default Branch using native query to bypass TenantId restrictions
        jdbcTemplate.update("INSERT INTO auth_service.branches (tenant_id, branch_name, location) VALUES (?, ?, ?)", 
                            tenantId, branchName != null ? branchName : "Main Branch", "Head Office");
                            
        // Get the generated branch_id
        Integer branchId = jdbcTemplate.queryForObject("SELECT branch_id FROM auth_service.branches WHERE tenant_id = ? ORDER BY branch_id DESC LIMIT 1", Integer.class, tenantId);

        // Insert Admin User using native query
        jdbcTemplate.update("INSERT INTO auth_service.users (tenant_id, username, password_hash, role_id, branch_id, full_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                            tenantId, adminUsername, adminPassword, 1, branchId, "System Administrator", "ACTIVE", LocalDateTime.now());

        // ── Seed default product types from Hikkaduwa template (tenant_id = 1) ──────────

        // 1. Savings account types
        jdbcTemplate.update(
            "INSERT INTO account_service.savings_account_type (code, name_en, name_si, is_child_account, interest_rate, tenant_id) " +
            "SELECT code, name_en, name_si, is_child_account, interest_rate, ? " +
            "FROM account_service.savings_account_type WHERE tenant_id = 1",
            tenantId);

        // 2. Fixed deposit types (code must be unique per tenant now)
        jdbcTemplate.update(
            "INSERT INTO account_service.fixed_deposit_types (id, code, name, term_months, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, tenant_id) " +
            "SELECT gen_random_uuid(), code, name, term_months, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, ? " +
            "FROM account_service.fixed_deposit_types WHERE tenant_id = 1",
            tenantId);

        // 3. Loan types
        jdbcTemplate.update(
            "INSERT INTO loan_service.loan_types (loan_type_id, name, description, interest_rate, max_amount, max_term_months, is_active, eligibility_criteria, created_at, updated_at, tenant_id) " +
            "SELECT gen_random_uuid(), name, description, interest_rate, max_amount, max_term_months, is_active, eligibility_criteria, now(), now(), ? " +
            "FROM loan_service.loan_types WHERE tenant_id = 1",
            tenantId);

        // 4. Pawning settings (composite unique key per tenant: setting_key + tenant_id)
        jdbcTemplate.update(
            "INSERT INTO pawning_service.pawning_settings (setting_key, setting_value, description, tenant_id) " +
            "VALUES (?, '24.00', 'Pawning annual interest rate (%)', ?), (?, '80000.00', 'Advance per gold sovereign (Rs.)', ?)",
            "INTEREST_RATE", tenantId,
            "ADVANCE_PER_SOVEREIGN", tenantId);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestBody java.util.Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body("Status is required");
        }

        return organizationRepository.findById(id).map(org -> {
            org.setStatus(newStatus.toUpperCase());
            organizationRepository.save(org);
            return ResponseEntity.ok(org);
        }).orElse(ResponseEntity.notFound().build());
    }
}
