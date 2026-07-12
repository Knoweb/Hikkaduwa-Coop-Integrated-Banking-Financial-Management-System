package com.hmcs.savings.repository;

import com.hmcs.savings.entity.SchedulerLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SchedulerLogRepository extends JpaRepository<SchedulerLog, UUID> {
    Optional<SchedulerLog> findFirstByTaskNameOrderByExecutionTimeDesc(String taskName);
}
