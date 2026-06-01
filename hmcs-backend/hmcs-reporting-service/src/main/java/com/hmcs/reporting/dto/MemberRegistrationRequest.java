package com.hmcs.reporting.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MemberRegistrationRequest {
    private String fullName;
    private String nic;
    private String address;
    private String contactNumber;
    private LocalDate dateOfBirth;
}


