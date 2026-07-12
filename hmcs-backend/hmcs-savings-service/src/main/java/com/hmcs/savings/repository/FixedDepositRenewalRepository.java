package com.hmcs.savings.repository;

import com.hmcs.savings.entity.FixedDepositRenewal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface FixedDepositRenewalRepository extends JpaRepository<FixedDepositRenewal, UUID> {
    List<FixedDepositRenewal> findByOldFdId(UUID oldFdId);
    List<FixedDepositRenewal> findByNewFdId(UUID newFdId);
}
