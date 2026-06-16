package com.hmcs.savings.repository;

import com.hmcs.savings.entity.FixedDepositType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface FixedDepositTypeRepository extends JpaRepository<FixedDepositType, UUID> {
    Optional<FixedDepositType> findByCode(String code);
    List<FixedDepositType> findByIsActiveTrue();
}
