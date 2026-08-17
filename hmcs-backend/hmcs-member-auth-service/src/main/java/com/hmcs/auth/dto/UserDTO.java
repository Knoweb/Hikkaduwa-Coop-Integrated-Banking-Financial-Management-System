package com.hmcs.auth.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserDTO {
    private UUID userId;

    @jakarta.validation.constraints.NotBlank(message = "Username is required")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$", message = "Username must be 3-50 characters, alphanumeric and underscores only")
    private String username;

    @jakarta.validation.constraints.NotBlank(message = "Full name is required")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z.\\s]{3,100}$", message = "Full name contains invalid characters")
    private String fullName;

    @jakarta.validation.constraints.NotBlank(message = "Role is required")
    private String role;

    private Integer branchId;

    private String status;

    private String email;

    private String mfaType;

    private String totpSecret;

    @jakarta.validation.constraints.Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$#&*])[A-Za-z\\d@$#&*]{8,}$|^\s*$", 
        message = "Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character (@$#&*)"
    )
    private String password;
}
