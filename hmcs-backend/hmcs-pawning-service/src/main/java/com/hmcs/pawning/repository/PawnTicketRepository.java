package com.hmcs.pawning.repository;

import com.hmcs.pawning.entity.PawnTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PawnTicketRepository extends JpaRepository<PawnTicket, UUID> {
    List<PawnTicket> findByBranchIdOrderByIssueDateDesc(Integer branchId);
    List<PawnTicket> findByMemberId(UUID memberId);
    Optional<PawnTicket> findByTicketNumber(String ticketNumber);
    long countByBranchId(Integer branchId);
}
