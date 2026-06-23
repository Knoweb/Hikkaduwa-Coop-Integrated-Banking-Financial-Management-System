package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanFamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanFamilyMemberRepository extends JpaRepository<LoanFamilyMember, UUID> {
    List<LoanFamilyMember> findByLoanId(UUID loanId);
    List<LoanFamilyMember> findByLoanIdAndOwnerType(UUID loanId, String ownerType);
    void deleteByLoanId(UUID loanId);
}
