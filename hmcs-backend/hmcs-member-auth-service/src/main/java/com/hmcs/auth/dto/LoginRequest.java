package com.hmcs.auth.dto;
import lombok.Data;

@Data
public class LoginRequest {
    private String tenantCode; // The subdomain (e.g., 'hikkaduwa')
    private String username;
    private String password;
}
