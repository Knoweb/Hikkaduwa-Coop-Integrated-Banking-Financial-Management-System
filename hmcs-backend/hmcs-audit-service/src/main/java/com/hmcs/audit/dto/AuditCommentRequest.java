package com.hmcs.audit.dto;

import lombok.Data;

@Data
public class AuditCommentRequest {
    private String comment;
    private Integer branchId;
}
