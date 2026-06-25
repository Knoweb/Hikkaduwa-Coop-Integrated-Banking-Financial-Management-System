package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanGuarantor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanGuarantorRepository extends JpaRepository<LoanGuarantor, UUID> {
    List<LoanGuarantor> findByLoanIdOrderByGuarantorNumberAsc(UUID loanId);
    void deleteByLoanId(UUID loanId);
}
