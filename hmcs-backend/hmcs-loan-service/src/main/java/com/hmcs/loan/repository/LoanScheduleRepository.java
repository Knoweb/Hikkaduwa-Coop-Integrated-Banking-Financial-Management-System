package com.hmcs.loan.repository;

import com.hmcs.loan.entity.LoanSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanScheduleRepository extends JpaRepository<LoanSchedule, UUID> {
    List<LoanSchedule> findByLoanIdOrderByInstallmentNumberAsc(UUID loanId);
    List<LoanSchedule> findByLoanIdAndStatusOrderByInstallmentNumberAsc(UUID loanId, LoanSchedule.ScheduleStatus status);
    List<LoanSchedule> findByStatusOrderByInstallmentNumberAsc(LoanSchedule.ScheduleStatus status);
    void deleteByLoanId(UUID loanId);
}
