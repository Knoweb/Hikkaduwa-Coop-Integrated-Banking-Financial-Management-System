package com.hmcs.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private UUID id;
    private String username;
    private String fullName;
    private Integer branchId;
    private String role;

    public JwtResponse(String token, UUID id, String username, String fullName, Integer branchId, String role) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.branchId = branchId;
        this.role = role;
    }
}
