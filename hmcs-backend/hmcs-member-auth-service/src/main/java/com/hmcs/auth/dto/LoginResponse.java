package com.hmcs.auth.dto;
import lombok.Data;

@Data
public class LoginResponse {
    private java.util.UUID userId;
    private String token;
    private String username;
    private String fullName;
    private String role;
    private Integer branchId;   // returned to frontend for display only — never trusted for filtering
    private String branchName;
    private Integer tenantId;
    private String organizationName;
    private boolean requireOtp;
    private String tempToken;
    private String mfaType;
}
