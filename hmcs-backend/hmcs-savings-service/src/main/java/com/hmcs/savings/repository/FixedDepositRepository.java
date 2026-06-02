package com.hmcs.savings.repository;
import com.hmcs.savings.entity.FixedDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface FixedDepositRepository extends JpaRepository<FixedDeposit, UUID> {
}
