package com.hmcs.savings.controller;

import com.hmcs.savings.entity.FixedDeposit;
import com.hmcs.savings.entity.FixedDepositType;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.repository.FixedDepositRenewalRepository;
import com.hmcs.savings.repository.FixedDepositRepository;
import com.hmcs.savings.repository.FixedDepositTypeRepository;
import com.hmcs.savings.repository.LedgerEntryRepository;
import com.hmcs.savings.repository.TransactionRepository;
import com.hmcs.savings.security.BranchContext;
import com.hmcs.savings.service.FixedDepositInterestService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FixedDepositControllerTest {

    @Mock
    private FixedDepositRepository fdRepository;
    @Mock
    private FixedDepositTypeRepository typeRepository;
    @Mock
    private FixedDepositRenewalRepository renewalRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private BranchContext branchContext;
    @Mock
    private FixedDepositInterestService interestService;
    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private FixedDepositController controller;

    private FixedDepositController.OpenFdRequest request;
    private MockHttpServletRequest httpRequest;

    @BeforeEach
    public void setup() {
        request = new FixedDepositController.OpenFdRequest();
        request.memberId = UUID.randomUUID();
        request.typeId = UUID.randomUUID();
        httpRequest = new MockHttpServletRequest();
    }

    @Test
    public void testOpenFixedDeposit_WithZeroPrincipal_ReturnsBadRequest() {
        // Arrange
        request.principalAmount = BigDecimal.ZERO;

        // Act
        ResponseEntity<?> response = controller.openFixedDeposit(request, httpRequest);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Principal amount must be greater than zero", response.getBody());
        verify(fdRepository, never()).save(any());
    }

    @Test
    public void testOpenFixedDeposit_WithNegativePrincipal_ReturnsBadRequest() {
        // Arrange
        request.principalAmount = new BigDecimal("-5000.00");

        // Act
        ResponseEntity<?> response = controller.openFixedDeposit(request, httpRequest);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Principal amount must be greater than zero", response.getBody());
        verify(fdRepository, never()).save(any());
    }

    @Test
    public void testOpenFixedDeposit_WithValidPrincipal_ReturnsOk() {
        // Arrange
        request.principalAmount = new BigDecimal("100000.00");
        request.openedDate = LocalDate.now();
        request.interestPayoutMethod = "MONTHLY";
        
        FixedDepositType mockType = new FixedDepositType();
        mockType.setId(request.typeId);
        mockType.setInterestRateMonthly(new BigDecimal("10.5"));
        mockType.setInterestRateMaturity(new BigDecimal("11.0"));
        mockType.setTermMonths(12);

        when(typeRepository.findById(request.typeId)).thenReturn(Optional.of(mockType));
        when(branchContext.extractBranchId(httpRequest)).thenReturn(1);
        
        FixedDeposit savedFd = new FixedDeposit();
        savedFd.setFdId(UUID.randomUUID());
        savedFd.setOpenedDate(LocalDate.now());
        savedFd.setFdNumber("FD-123456");
        savedFd.setPrincipalAmount(request.principalAmount);
        savedFd.setBranchId(1);
        
        when(fdRepository.save(any(FixedDeposit.class))).thenReturn(savedFd);

        // Act
        ResponseEntity<?> response = controller.openFixedDeposit(request, httpRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(fdRepository, times(1)).save(any(FixedDeposit.class));
        verify(ledgerEntryRepository, times(1)).save(any());
    }
}
