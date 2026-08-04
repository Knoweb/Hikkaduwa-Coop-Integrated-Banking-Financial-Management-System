package com.hmcs.audit.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class BranchContext {

    private final JwtUtil jwtUtil;

    public BranchContext(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        throw new RuntimeException("No Authorization header found");
    }

    public Integer extractBranchId(HttpServletRequest request) {
        try {
            return jwtUtil.extractBranchId(getTokenFromRequest(request));
        } catch (Exception e) {
            return null;
        }
    }

    public String extractRole(HttpServletRequest request) {
        try {
            return jwtUtil.extractRole(getTokenFromRequest(request));
        } catch (Exception e) {
            return null;
        }
    }

    public String extractUsername(HttpServletRequest request) {
        try {
            return jwtUtil.extractUsername(getTokenFromRequest(request));
        } catch (Exception e) {
            return null;
        }
    }
}
