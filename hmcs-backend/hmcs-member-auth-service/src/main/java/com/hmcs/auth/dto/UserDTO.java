package com.hmcs.auth.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserDTO {
    private UUID userId;
    private String username;
    private String fullName;
    private String role;
    private Integer branchId;
    private String status;
    private String password;
}
