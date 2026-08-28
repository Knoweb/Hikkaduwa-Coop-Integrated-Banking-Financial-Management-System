package com.hmcs.loan.controller;

import com.hmcs.loan.entity.Loan;
import com.hmcs.loan.service.LoanService;
import com.hmcs.loan.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
public class LoanControllerTest {

    @Mock
    private LoanService loanService;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private LoanController loanController;

    private MockHttpServletRequest request;
    private Loan mockLoan;
    private UUID loanTypeId;

    @BeforeEach
    public void setup() {
        request = new MockHttpServletRequest();
        loanTypeId = UUID.randomUUID();
        
        mockLoan = new Loan();
        mockLoan.setLoanId(UUID.randomUUID());
        mockLoan.setRequestedAmount(new BigDecimal("500000.00"));
        mockLoan.setBranchId(1);
    }

    @Test
    public void testApplyForLoan_Success() {
        // Arrange
        when(loanService.applyForLoan(any(Loan.class), eq(loanTypeId))).thenReturn(mockLoan);

        // Act
        ResponseEntity<Loan> response = loanController.applyForLoan(loanTypeId, mockLoan);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(new BigDecimal("500000.00"), response.getBody().getRequestedAmount());
        verify(loanService, times(1)).applyForLoan(any(Loan.class), eq(loanTypeId));
    }
    
    @Test
    public void testGetAllLoans_BranchManager_SeesOnlyOwnBranch() {
        // Arrange
        request.addHeader("Authorization", "Bearer valid_token");
        when(jwtUtil.extractBranchId("valid_token")).thenReturn(1);
        when(jwtUtil.extractRole("valid_token")).thenReturn("BRANCH_MANAGER");
        
        Loan loan1 = new Loan(); loan1.setBranchId(1);
        Loan loan2 = new Loan(); loan2.setBranchId(1);
        when(loanService.getAllLoans(1)).thenReturn(Arrays.asList(loan1, loan2));

        // Act
        List<Loan> loans = loanController.getAllLoans(null, request);

        // Assert
        assertEquals(2, loans.size());
        assertEquals(1, loans.get(0).getBranchId());
        verify(loanService, times(1)).getAllLoans(1);
    }
}
