package com.hmcs.savings.repository;
import com.hmcs.savings.entity.FixedDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

import java.util.List;

public interface FixedDepositRepository extends JpaRepository<FixedDeposit, UUID> {
    List<FixedDeposit> findByMemberId(UUID memberId);
    List<FixedDeposit> findByStatus(String status);
}
