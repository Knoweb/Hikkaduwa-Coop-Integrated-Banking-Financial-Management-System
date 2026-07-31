package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {

    // All entries for a specific branch
    List<LedgerEntry> findByBranchIdOrderByEntryDateDesc(Integer branchId);

    // All entries globally (for General Manager / System Admin)
    List<LedgerEntry> findAllByOrderByEntryDateDesc();

    // Entries for a specific loan
    List<LedgerEntry> findByLoanIdOrderByEntryDateDesc(UUID loanId);

    // Entries for a date range
    List<LedgerEntry> findByEntryDateBetweenOrderByEntryDateDesc(LocalDate from, LocalDate to);

    // Entries for a branch within a date range
    List<LedgerEntry> findByBranchIdAndEntryDateBetweenOrderByEntryDateDesc(
            Integer branchId, LocalDate from, LocalDate to
    );
    void deleteByLoanId(UUID loanId);
    List<LedgerEntry> findByReferenceNumber(String referenceNumber);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(CASE WHEN e.debitAccount = :account THEN e.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN e.creditAccount = :account THEN e.amount ELSE 0 END), 0) FROM LedgerEntry e")
    java.math.BigDecimal getAccountBalance(@org.springframework.data.repository.query.Param("account") String account);
}
