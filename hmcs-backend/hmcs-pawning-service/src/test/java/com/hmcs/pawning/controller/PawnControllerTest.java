package com.hmcs.pawning.controller;

import com.hmcs.pawning.dto.IssueTicketRequest;
import com.hmcs.pawning.dto.PawnTicketResponse;
import com.hmcs.pawning.service.PawnService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
public class PawnControllerTest {

    @Mock
    private PawnService pawnService;

    @InjectMocks
    private PawnController pawnController;

    private IssueTicketRequest request;
    private PawnTicketResponse responseMock;

    @BeforeEach
    public void setup() {
        request = new IssueTicketRequest();
        request.setMemberId(UUID.randomUUID());
        request.setAssessedValue(new BigDecimal("150000.00"));
        request.setGrossWeightGrams(new BigDecimal("10.5"));

        responseMock = new PawnTicketResponse();
        responseMock.setTicketId(UUID.randomUUID());
        responseMock.setTicketNumber("PT-123456");
        responseMock.setAssessedValue(new BigDecimal("150000.00"));
    }

    @Test
    public void testIssueTicket_Success() {
        // Arrange
        when(pawnService.issueTicket(any(IssueTicketRequest.class))).thenReturn(responseMock);

        // Act
        ResponseEntity<PawnTicketResponse> response = pawnController.issueTicket(request);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("PT-123456", response.getBody().getTicketNumber());
        assertEquals(new BigDecimal("150000.00"), response.getBody().getAssessedValue());
        
        verify(pawnService, times(1)).issueTicket(any(IssueTicketRequest.class));
    }
}
