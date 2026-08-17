package com.hmcs.auth.dto;

import lombok.Data;

@Data
public class VerifyOtpRequest {
    private String tempToken;
    private String otp;
}
