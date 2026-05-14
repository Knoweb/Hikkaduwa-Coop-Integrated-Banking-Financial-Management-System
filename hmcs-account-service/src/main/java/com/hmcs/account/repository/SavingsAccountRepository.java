package com.hmcs.account.repository;

import com.hmcs.account.entity.SavingsAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavingsAccountRepository extends JpaRepository<SavingsAccount, Long> {

    // IMPORTANT: Branch Isolation Query
    List<SavingsAccount> findByBranchId(Long branchId);
    
    Optional<SavingsAccount> findByAccountNumberAndBranchId(String accountNumber, Long branchId);
    
    List<SavingsAccount> findByMemberMemberIdAndBranchId(Long memberId, Long branchId);
}
