package com.hmcs.auth.dto;

import lombok.Data;

@Data
public class BranchDTO {
    private Integer branchId;
    private String branchName;
    private String location;
    private String status;
}
