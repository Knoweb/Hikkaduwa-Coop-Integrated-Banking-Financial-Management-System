package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanAssetDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LoanAssetDetailRepository extends JpaRepository<LoanAssetDetail, UUID> {
    Optional<LoanAssetDetail> findByLoanId(UUID loanId);
}
