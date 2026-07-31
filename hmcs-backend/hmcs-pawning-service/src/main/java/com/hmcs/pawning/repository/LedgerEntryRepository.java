package com.hmcs.pawning.repository;

import com.hmcs.pawning.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    void deleteByDescriptionContaining(String text);
}
