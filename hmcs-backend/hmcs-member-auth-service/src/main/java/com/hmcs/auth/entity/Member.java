package com.hmcs.auth.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "members", schema = "member_service")
public class Member {
    @TenantId
    private Integer tenantId;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID memberId;

    @Column(unique = true, length = 20)
    private String membershipNumber;

    @NotBlank(message = "NIC is required")
    @Pattern(regexp = "^([0-9]{9}[vVxX]|[0-9]{12})$", message = "Invalid NIC format")
    @Column(nullable = false, unique = true, length = 20)
    private String nic;

    @Column(name = "name_with_initials", length = 150)
    private String nameWithInitials;

    @NotBlank(message = "Full Name is required")
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(length = 150)
    private String fullNameSinhala;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String gender; // MALE / FEMALE

    @Column(length = 15)
    private String maritalStatus; // MARRIED / UNMARRIED

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(length = 50)
    private String province;

    @Pattern(regexp = "^(\\+?[0-9]{10,12})?$", message = "Invalid contact number format")
    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "is_member")
    private Boolean isMember = true;

    @Column(name = "registered_branch_id")
    private Integer registeredBranchId;

    @Column(precision = 10, scale = 2)
    private BigDecimal shareAmount = BigDecimal.ZERO;

    @Column(name = "number_of_shares")
    private Integer numberOfShares = 0;

    @Column(name = "age_category", length = 20)
    private String ageCategory = "ADULT";

    @Pattern(regexp = "^([0-9]{9}[vVxX]|[0-9]{12})?$", message = "Invalid Guardian NIC format")
    @Column(name = "guardian_nic", length = 20)
    private String guardianNic;

    @Column(name = "guardian_member_no", length = 20)
    private String guardianMemberNo;

    @Column
    private Boolean belongsToOtherSociety = false;

    @Column(length = 150)
    private String otherSocietyName;

    @Column(columnDefinition = "TEXT")
    private String digitalSignatureUrl;

    @Column(columnDefinition = "TEXT")
    private String photographUrl;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "deceased_date")
    private LocalDate deceasedDate;

    @Column(name = "insurance_claim_notes", columnDefinition = "TEXT")
    private String insuranceClaimNotes;
}
