package com.hmcs.savings.repository;

import com.hmcs.savings.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    Optional<LedgerEntry> findByTransactionId(UUID transactionId);
    void deleteByDescriptionContaining(String descriptionPart);
}
