package com.hmcs.pawning.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "pawn_payments", schema = "pawning_service")
public class PawnPayment {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "payment_id", updatable = false, nullable = false)
    private UUID paymentId;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "payment_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal paymentAmount;

    @Column(name = "principal_portion", precision = 15, scale = 2)
    private BigDecimal principalPortion;

    @Column(name = "interest_portion", precision = 15, scale = 2)
    private BigDecimal interestPortion;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate = LocalDateTime.now();

    @Column(name = "receipt_number", length = 50)
    private String receiptNumber;

}
