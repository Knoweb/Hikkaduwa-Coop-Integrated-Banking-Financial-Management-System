package com.hmcs.audit.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.security.Key;
import java.util.Date;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class JwtUtilTest {

    private JwtUtil jwtUtil;
    private String secretKey = "hmcs_secret_key_for_jwt_token_2026_hikkaduwa_bank_management_system";

    @BeforeEach
    public void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secretKey);
    }

    @Test
    public void testExtractUsernameAndRole() {
        // Arrange
        String expectedUsername = "admin_user";
        Key key = Keys.hmacShaKeyFor(secretKey.getBytes());
        String testToken = Jwts.builder()
                .setSubject(expectedUsername)
                .claim("role", "ADMIN")
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        // Act
        String actualUsername = jwtUtil.extractUsername(testToken);
        String actualRole = jwtUtil.extractRole(testToken);

        // Assert
        assertEquals(expectedUsername, actualUsername, "Username should be extracted correctly");
        assertEquals("ADMIN", actualRole, "Role should be extracted correctly");
    }
}
