package com.hmcs.savings.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtil {
    private final Key key = Keys.hmacShaKeyFor("hmcs_secret_key_for_jwt_token_2026_hikkaduwa_bank_management_system".getBytes());

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public Integer extractBranchId(String token) {
        return extractAllClaims(token).get("branchId", Integer.class);
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public Integer extractTenantId(String token) {
        return extractAllClaims(token).get("tenantId", Integer.class);
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }
}
