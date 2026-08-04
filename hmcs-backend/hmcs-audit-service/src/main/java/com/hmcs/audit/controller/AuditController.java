package com.hmcs.audit.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import com.hmcs.audit.security.BranchContext;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final JdbcTemplate jdbcTemplate;
    private final BranchContext branchContext;

    public AuditController(JdbcTemplate jdbcTemplate, BranchContext branchContext) {
        this.jdbcTemplate = jdbcTemplate;
        this.branchContext = branchContext;
    }

    @GetMapping("/corrections")
    public ResponseEntity<List<Map<String, Object>>> getAuditCorrections(HttpServletRequest request) {
        String xTenantId = request.getHeader("X-Tenant-ID");
        Integer tenantId = null;
        if (xTenantId != null && !xTenantId.isEmpty()) {
            try {
                tenantId = Integer.parseInt(xTenantId);
            } catch (NumberFormatException e) {
                // ignore
            }
        }
        if (tenantId == null) {
            tenantId = branchContext.extractBranchId(request);
        }

        String sql = "SELECT " +
            "c.correction_id as \"correctionId\", " +
            "c.transaction_id as \"transactionId\", " +
            "c.old_amount as \"oldAmount\", " +
            "c.new_amount as \"newAmount\", " +
            "c.module_type as \"moduleType\", " +
            "c.manager_id as \"managerId\", " +
            "m.full_name as \"managerFullName\", " +
            "c.reason, " +
            "c.timestamp, " +
            "COALESCE(CASE WHEN sa.account_number IS NOT NULL THEN CONCAT(t.transaction_type, ' — Account: ', sa.account_number, ' | Member: ', sa.member_id) ELSE NULL END, CASE WHEN fd.fd_number IS NOT NULL THEN CONCAT('Fixed Deposit — FD: ', fd.fd_number, ' | Member: ', fd.member_id) ELSE NULL END, CASE WHEN pt.ticket_number IS NOT NULL AND pp.payment_id IS NULL THEN CONCAT('Pawning Ticket: ', pt.ticket_number, ' (', pt.article_description, ') | Member: ', pt.member_id) ELSE NULL END, l.description, CASE WHEN pp.receipt_number IS NOT NULL THEN CONCAT('Pawning Payment Receipt: ', pp.receipt_number) ELSE NULL END, t.reference, l.reference_number, c.transaction_id::text) as \"transactionReference\", " +
            "COALESCE(t.transaction_type, l.entry_type, c.module_type) as \"transactionType\", " +
            "COALESCE(t.transaction_timestamp, pp.payment_date::timestamp, fd.created_at, pt.issue_date::timestamp, l.created_at, c.timestamp) as \"originalTimestamp\", " +
            "COALESCE(u.username, u2.username, pt.valuer_id::text, 'senior_hkw') as \"originalCreatorUsername\", " +
            "COALESCE(u.full_name, u2.full_name, u3.full_name, 'L.M. Silva (Senior Officer)') as \"originalCreatorFullName\" " +
            "FROM audit_service.audit_corrections c " +
            "LEFT JOIN auth_service.users m ON c.manager_id = m.username " +
            "LEFT JOIN account_service.transactions t ON c.transaction_id::text = t.transaction_id::text " +
            "LEFT JOIN account_service.savings_accounts sa ON t.account_id = sa.account_id " +
            "LEFT JOIN auth_service.users u ON t.processed_by::text = u.user_id::text " +
            "LEFT JOIN LATERAL (SELECT created_at, created_by, reference_number, description, entry_type FROM loan_service.ledger_entries WHERE c.transaction_id::text = entry_id::text OR c.transaction_id::text = transaction_id::text OR c.transaction_id::text = reference_number::text ORDER BY created_at ASC LIMIT 1) l ON true " +
            "LEFT JOIN auth_service.users u2 ON l.created_by::text = u2.username::text OR l.created_by::text = u2.user_id::text " +
            "LEFT JOIN account_service.fixed_deposits fd ON c.transaction_id::text = fd.fd_id::text " +
            "LEFT JOIN pawning_service.pawn_payments pp ON c.transaction_id::text = pp.payment_id::text " +
            "LEFT JOIN pawning_service.pawn_tickets pt ON c.transaction_id::text = pt.ticket_id::text OR pp.ticket_id::text = pt.ticket_id::text " +
            "LEFT JOIN auth_service.users u3 ON pt.valuer_id::text = u3.username::text OR pt.valuer_id::text = u3.user_id::text " +
            "WHERE c.tenant_id = ? ORDER BY c.timestamp DESC";
        List<Map<String, Object>> corrections = jdbcTemplate.queryForList(sql, tenantId);
        return ResponseEntity.ok(corrections);
    }
}
