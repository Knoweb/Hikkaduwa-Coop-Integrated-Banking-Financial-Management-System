package com.hmcs.loan.repository;

import com.hmcs.loan.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanRepository extends JpaRepository<Loan, UUID> {
    List<Loan> findByMemberId(UUID memberId);
    List<Loan> findByStatus(String status);
}
