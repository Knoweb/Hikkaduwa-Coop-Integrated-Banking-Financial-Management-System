package com.hmcs.audit.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuditControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGetAuditLogs_WithoutToken_ReturnsUnauthorized() throws Exception {
        // 1.4.3 & 1.4.5 Integration & Security Test: 
        // Attempting to access a protected endpoint without a token should fail (401 or 403)
        mockMvc.perform(get("/api/v1/audit/logs")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // Security framework should block this
    }
}
