package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanApplicantDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LoanApplicantDetailRepository extends JpaRepository<LoanApplicantDetail, UUID> {
    Optional<LoanApplicantDetail> findByLoanId(UUID loanId);
    void deleteByLoanId(UUID loanId);
}
