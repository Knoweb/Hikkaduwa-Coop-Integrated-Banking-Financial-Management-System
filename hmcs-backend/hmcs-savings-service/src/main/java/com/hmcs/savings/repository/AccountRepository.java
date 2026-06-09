package com.hmcs.savings.repository;
import com.hmcs.savings.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByMemberId(UUID memberId);
    Account findByAccountNumber(String accountNumber);
}
