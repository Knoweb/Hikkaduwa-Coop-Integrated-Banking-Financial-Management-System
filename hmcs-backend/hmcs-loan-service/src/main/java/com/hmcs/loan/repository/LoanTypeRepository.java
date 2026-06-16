package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanTypeRepository extends JpaRepository<LoanType, UUID> {
    List<LoanType> findByIsActiveTrue();
}
