package com.hmcs.savings.repository;

import com.hmcs.savings.entity.DailyBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyBalanceRepository extends JpaRepository<DailyBalance, UUID> {
    List<DailyBalance> findByAccountIdAndRecordDateBetween(UUID accountId, LocalDate startDate, LocalDate endDate);
}
