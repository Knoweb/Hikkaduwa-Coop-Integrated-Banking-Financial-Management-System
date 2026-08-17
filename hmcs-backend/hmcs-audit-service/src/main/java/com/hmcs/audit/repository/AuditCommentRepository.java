package com.hmcs.audit.repository;

import com.hmcs.audit.entity.AuditComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditCommentRepository extends JpaRepository<AuditComment, Long> {
    List<AuditComment> findAllByOrderByCreatedAtDesc();
    List<AuditComment> findByBranchIdOrderByCreatedAtDesc(Integer branchId);
    List<AuditComment> findByTenantIdOrderByCreatedAtDesc(Integer tenantId);
}
