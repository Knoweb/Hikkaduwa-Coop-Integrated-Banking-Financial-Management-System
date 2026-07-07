package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanApprovalAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanApprovalActionRepository extends JpaRepository<LoanApprovalAction, UUID> {
    List<LoanApprovalAction> findByLoanIdOrderByCreatedAtAsc(UUID loanId);
    void deleteByLoanId(UUID loanId);
}
