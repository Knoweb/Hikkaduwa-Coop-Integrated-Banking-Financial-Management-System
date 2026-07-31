package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanRepaymentRepository extends JpaRepository<LoanRepayment, UUID> {
    List<LoanRepayment> findByLoanIdOrderByPaymentDateDesc(UUID loanId);
    List<LoanRepayment> findByLoanIdOrderByPaymentDateAsc(UUID loanId);
    List<LoanRepayment> findByPaymentBranchIdOrderByPaymentDateDesc(Long paymentBranchId);
    void deleteByLoanId(UUID loanId);
}
