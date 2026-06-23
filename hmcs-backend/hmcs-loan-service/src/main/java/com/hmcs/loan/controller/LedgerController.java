package com.hmcs.loan.controller;

import com.hmcs.loan.entity.LedgerEntry;
import com.hmcs.loan.repository.LedgerEntryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ledger")
public class LedgerController {

    private final LedgerEntryRepository ledgerRepo;

    public LedgerController(LedgerEntryRepository ledgerRepo) {
        this.ledgerRepo = ledgerRepo;
    }

    /**
     * Get ALL ledger entries — for General Manager / System Admin.
     * GET /api/v1/ledger
     */
    @GetMapping
    public ResponseEntity<List<LedgerEntry>> getAllEntries() {
        return ResponseEntity.ok(ledgerRepo.findAllByOrderByEntryDateDesc());
    }

    /**
     * Get ledger entries for a specific branch — for Branch Manager.
     * GET /api/v1/ledger/branch/1
     */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<LedgerEntry>> getByBranch(@PathVariable Integer branchId) {
        return ResponseEntity.ok(ledgerRepo.findByBranchIdOrderByEntryDateDesc(branchId));
    }

    /**
     * Get ledger entries for a specific loan.
     * GET /api/v1/ledger/loan/{loanId}
     */
    @GetMapping("/loan/{loanId}")
    public ResponseEntity<List<LedgerEntry>> getByLoan(@PathVariable UUID loanId) {
        return ResponseEntity.ok(ledgerRepo.findByLoanIdOrderByEntryDateDesc(loanId));
    }

    /**
     * Get ledger entries filtered by date range — for reporting.
     * GET /api/v1/ledger?from=2026-01-01&to=2026-12-31
     */
    @GetMapping("/range")
    public ResponseEntity<List<LedgerEntry>> getByDateRange(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Integer branchId
    ) {
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        if (branchId != null) {
            return ResponseEntity.ok(
                    ledgerRepo.findByBranchIdAndEntryDateBetweenOrderByEntryDateDesc(branchId, fromDate, toDate)
            );
        }
        return ResponseEntity.ok(
                ledgerRepo.findByEntryDateBetweenOrderByEntryDateDesc(fromDate, toDate)
        );
    }
}
