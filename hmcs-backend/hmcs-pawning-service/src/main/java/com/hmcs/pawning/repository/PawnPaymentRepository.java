package com.hmcs.pawning.repository;

import com.hmcs.pawning.entity.PawnPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PawnPaymentRepository extends JpaRepository<PawnPayment, UUID> {
    List<PawnPayment> findByTicketIdOrderByPaymentDateDesc(UUID ticketId);
    List<PawnPayment> findByTicketIdOrderByPaymentDateAsc(UUID ticketId);
}
