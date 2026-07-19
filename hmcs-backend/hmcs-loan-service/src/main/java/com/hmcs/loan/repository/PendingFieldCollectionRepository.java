package com.hmcs.loan.repository;

import com.hmcs.loan.entity.PendingFieldCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PendingFieldCollectionRepository extends JpaRepository<PendingFieldCollection, UUID> {
    List<PendingFieldCollection> findByStatusAndBranchId(String status, Long branchId);
    List<PendingFieldCollection> findByBranchId(Long branchId);
    List<PendingFieldCollection> findByFieldOfficerUsernameAndStatus(String fieldOfficerUsername, String status);
    List<PendingFieldCollection> findByFieldOfficerUsernameOrderByCreatedAtDesc(String fieldOfficerUsername);
}
