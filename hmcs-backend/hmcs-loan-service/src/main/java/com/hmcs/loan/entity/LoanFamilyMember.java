package com.hmcs.loan.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

/**
 * Stores family member records for a loan applicant (or guarantor).
 */
@Entity
@Table(name = "loan_family_members", schema = "loan_service")
@Data
public class LoanFamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "family_member_id", updatable = false, nullable = false)
    private UUID familyMemberId;

    @Column(name = "loan_id", nullable = false)
    private UUID loanId;

    /**
     * "APPLICANT" or "GUARANTOR_1" / "GUARANTOR_2"
     * to distinguish which person's family this belongs to
     */
    @Column(name = "owner_type", length = 20)
    private String ownerType;

    @Column(name = "member_name", length = 200)
    private String memberName;

    @Column(name = "age", length = 10)
    private String age;

    @Column(name = "relation", length = 100)
    private String relation;

    @Column(name = "job", length = 200)
    private String job;
}
