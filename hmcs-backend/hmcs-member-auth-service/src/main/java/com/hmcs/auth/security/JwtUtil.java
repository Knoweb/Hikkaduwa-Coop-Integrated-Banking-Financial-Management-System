package com.hmcs.auth.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.util.Date;
import java.security.Key;

@Component
public class JwtUtil {
    private final Key key = Keys.hmacShaKeyFor("hmcs_secret_key_for_jwt_token_2026_hikkaduwa_bank_management_system".getBytes());

    // branchId and tenantId are embedded in the token
    public String generateToken(String username, String role, Integer branchId, Integer tenantId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("branchId", branchId)
                .claim("tenantId", tenantId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(key)
                .compact();
    }

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
