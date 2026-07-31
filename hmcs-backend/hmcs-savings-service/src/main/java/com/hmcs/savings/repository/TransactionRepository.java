package com.hmcs.savings.repository;
import com.hmcs.savings.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByAccountAccountId(UUID accountId);
    
    long countByAccountAccountIdAndTransactionTypeAndTransactionTimestampAfter(
            UUID accountId, 
            String transactionType, 
            java.time.LocalDateTime timestamp
    );

    List<Transaction> findByBranchIdOrderByTransactionTimestampDesc(Integer branchId, org.springframework.data.domain.Pageable pageable);
    List<Transaction> findByBranchIdAndTransactionTimestampBetweenOrderByTransactionTimestampDesc(Integer branchId, java.time.LocalDateTime start, java.time.LocalDateTime end, org.springframework.data.domain.Pageable pageable);
    
    List<Transaction> findByAccountAccountIdOrderByTransactionTimestampAsc(UUID accountId);
}
