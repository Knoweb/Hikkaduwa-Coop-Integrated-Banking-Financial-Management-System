package com.hmcs.pawning.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Entity
@Table(name = "pawn_tickets", schema = "pawning_service")
public class PawnTicket {
    @TenantId
    private Integer tenantId;


    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "ticket_id", updatable = false, nullable = false)
    private UUID ticketId;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 20)
    private String ticketNumber;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @Column(name = "article_description", nullable = false, length = 255)
    private String articleDescription;

    @Column(name = "gross_weight_grams", nullable = false, precision = 8, scale = 2)
    private BigDecimal grossWeightGrams;

    @Column(name = "net_weight_grams", nullable = false, precision = 8, scale = 2)
    private BigDecimal netWeightGrams;

    @Column(name = "purity_karat", nullable = false)
    private Integer purityKarat;

    @Column(name = "assessed_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal assessedValue;

    @Column(name = "advance_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal advanceAmount;

    @Column(name = "interest_rate", precision = 5, scale = 2)
    private BigDecimal interestRate = new BigDecimal("13.00");

    @Column(name = "branch_id", nullable = false)
    private Integer branchId;

    @Column(name = "valuer_id", nullable = false)
    private UUID valuerId;

    @Column(name = "issue_date")
    private LocalDate issueDate = LocalDate.now();

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    // ACTIVE, REDEEMED, AUCTIONED, OVERDUE
    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    @Column(name = "remaining_advance", precision = 15, scale = 2)
    private BigDecimal remainingAdvance;

    @Column(name = "last_payment_date")
    private LocalDate lastPaymentDate;

    @Column(name = "carried_over_interest", precision = 15, scale = 2)
    private BigDecimal carriedOverInterest = BigDecimal.ZERO;

    @Column(name = "committee_remarks", length = 500)
    private String committeeRemarks;

    @PrePersist
    public void prePersist() {
        if (remainingAdvance == null) {
            remainingAdvance = advanceAmount;
        }
        if (lastPaymentDate == null) {
            lastPaymentDate = issueDate != null ? issueDate : LocalDate.now();
        }
        if (carriedOverInterest == null) {
            carriedOverInterest = BigDecimal.ZERO;
        }
    }

}
