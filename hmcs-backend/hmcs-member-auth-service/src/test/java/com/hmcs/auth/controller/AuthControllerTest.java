package com.hmcs.auth.controller;

import com.hmcs.auth.dto.LoginRequest;
import com.hmcs.auth.repository.BranchRepository;
import com.hmcs.auth.repository.RoleRepository;
import com.hmcs.auth.repository.SystemAuditLogRepository;
import com.hmcs.auth.repository.UserRepository;
import com.hmcs.auth.security.JwtUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private EntityManager entityManager;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private SystemAuditLogRepository systemAuditLogRepository;
    
    @Mock
    private Query mockQuery;

    @InjectMocks
    private AuthController authController;

    private MockHttpServletRequest httpRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    public void setup() {
        httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("192.168.1." + java.util.UUID.randomUUID().toString().substring(0,2));

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password");
    }

    @Test
    public void testLogin_UserNotFound_ReturnsUnauthorized() {
        // Arrange
        when(entityManager.createNativeQuery(anyString())).thenReturn(mockQuery);
        when(mockQuery.setParameter(anyString(), any())).thenReturn(mockQuery);
        when(mockQuery.getResultList()).thenReturn(Collections.emptyList());

        // Act
        ResponseEntity<?> response = authController.login(loginRequest, httpRequest);

        // Assert
        assertEquals(401, response.getStatusCode().value());
        assertEquals("Invalid credentials or inactive user", response.getBody());
        verify(systemAuditLogRepository, times(1)).save(any());
    }
    
    @Test
    public void testLogin_EmptyUsername_ReturnsBadRequest() {
        // Arrange
        loginRequest.setUsername("");

        // Act
        ResponseEntity<?> response = authController.login(loginRequest, httpRequest);

        // Assert
        assertEquals(400, response.getStatusCode().value());
        assertEquals("Username is required", response.getBody());
    }

    @Test
    public void testLogin_RateLimiter_ExceedsLimit() {
        // Arrange
        // Simulate hitting the rate limit (MAX_LOGIN_ATTEMPTS_PER_MINUTE is 15 in the controller)
        for (int i = 0; i < 15; i++) {
            when(entityManager.createNativeQuery(anyString())).thenReturn(mockQuery);
            when(mockQuery.setParameter(anyString(), any())).thenReturn(mockQuery);
            when(mockQuery.getResultList()).thenReturn(Collections.emptyList());
            authController.login(loginRequest, httpRequest);
        }

        // Act - The 16th attempt should be blocked
        ResponseEntity<?> response = authController.login(loginRequest, httpRequest);

        // Assert
        assertEquals(429, response.getStatusCode().value());
        verify(systemAuditLogRepository, atLeast(1)).save(argThat(log -> 
            "LOGIN_RATE_LIMIT_EXCEEDED".equals(log.getEventType())
        ));
    }
}
