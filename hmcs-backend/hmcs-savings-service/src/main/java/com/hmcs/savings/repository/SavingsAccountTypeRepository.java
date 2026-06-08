package com.hmcs.savings.repository;

import com.hmcs.savings.entity.SavingsAccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavingsAccountTypeRepository extends JpaRepository<SavingsAccountType, Long> {
    Optional<SavingsAccountType> findByCode(String code);
}
