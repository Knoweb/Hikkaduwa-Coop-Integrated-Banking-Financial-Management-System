package com.hmcs.auth.dto;
import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String username;
    private String role;
}
