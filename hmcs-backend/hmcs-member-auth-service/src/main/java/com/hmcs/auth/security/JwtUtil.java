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
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    // branchId is now embedded in the token — can never be tampered with from the frontend
    public String generateToken(String username, String role, Integer branchId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("branchId", branchId)
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

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }
}
