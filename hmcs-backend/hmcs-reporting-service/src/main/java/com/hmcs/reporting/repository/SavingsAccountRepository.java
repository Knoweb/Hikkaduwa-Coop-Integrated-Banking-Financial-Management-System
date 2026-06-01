package com.hmcs.reporting.repository;

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
    
    List<SavingsAccount> findByMemberMemberIdAndBranchId(java.util.UUID memberId, Long branchId);

    // Global Reporting for General Manager
    @org.springframework.data.jpa.repository.Query("SELECT SUM(s.balance) FROM SavingsAccount s")
    java.math.BigDecimal getTotalConsolidatedBalance();
}


