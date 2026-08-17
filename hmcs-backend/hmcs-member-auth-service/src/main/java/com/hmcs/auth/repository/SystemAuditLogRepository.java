package com.hmcs.auth.repository;

import com.hmcs.auth.entity.SystemAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLog, Long> {
    List<SystemAuditLog> findByTenantIdOrderByTimestampDesc(Long tenantId);
    List<SystemAuditLog> findByBranchIdOrderByTimestampDesc(Long branchId);
    List<SystemAuditLog> findAllByOrderByTimestampDesc();
}
