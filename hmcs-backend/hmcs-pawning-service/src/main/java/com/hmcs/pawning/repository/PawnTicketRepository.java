package com.hmcs.pawning.repository;

import com.hmcs.pawning.entity.PawnTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    // Bypass Hibernate tenant filter - used by Loan Committee to see ALL pending tickets
    @Query(value = "SELECT * FROM pawning_service.pawn_tickets ORDER BY issue_date DESC", nativeQuery = true)
    List<PawnTicket> findAllIgnoreTenant();

    // Get all pending tickets across all branches/tenants for committee approval
    @Query(value = "SELECT * FROM pawning_service.pawn_tickets WHERE status = 'PENDING' ORDER BY issue_date DESC", nativeQuery = true)
    List<PawnTicket> findAllPendingIgnoreTenant();

    @Query(value = "SELECT * FROM pawning_service.pawn_tickets WHERE ticket_id = :ticketId", nativeQuery = true)
    Optional<PawnTicket> findByIdIgnoreTenant(@org.springframework.data.repository.query.Param("ticketId") UUID ticketId);
}
