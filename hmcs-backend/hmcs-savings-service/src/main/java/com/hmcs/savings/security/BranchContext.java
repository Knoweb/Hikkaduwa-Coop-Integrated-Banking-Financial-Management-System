package com.hmcs.savings.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class BranchContext {

    private final JwtUtil jwtUtil;

    public BranchContext(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

        private String getTokenFromRequest(HttpServletRequest request) {
        String token = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        if (token == null) {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }
        if (token != null) {
            return token;
        }
        throw new RuntimeException("No Authorization header or cookie found");
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



