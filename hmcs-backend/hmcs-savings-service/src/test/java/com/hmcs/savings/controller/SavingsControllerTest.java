package com.hmcs.savings.controller;

import com.hmcs.savings.entity.Account;
import com.hmcs.savings.repository.AccountRepository;
import com.hmcs.savings.security.BranchContext;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SavingsControllerTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private BranchContext branchContext;

    @InjectMocks
    private SavingsController savingsController;

    private MockHttpServletRequest request;
    private List<Account> mockAccounts;

    @BeforeEach
    public void setup() {
        request = new MockHttpServletRequest();
        
        Account acc1 = new Account();
        acc1.setAccountId(UUID.randomUUID());
        acc1.setBranchId(1);
        
        Account acc2 = new Account();
        acc2.setAccountId(UUID.randomUUID());
        acc2.setBranchId(1);
        
        Account acc3 = new Account();
        acc3.setAccountId(UUID.randomUUID());
        acc3.setBranchId(2);
        
        mockAccounts = Arrays.asList(acc1, acc2, acc3);
    }

    @Test
    public void testGetAccounts_BranchOnlyTrue_ReturnsOnlyBranchAccounts() {
        // Arrange
        when(accountRepository.findAll()).thenReturn(mockAccounts);
        when(branchContext.extractBranchId(request)).thenReturn(1);

        // Act
        ResponseEntity<List<Account>> response = savingsController.getAccounts(request, true);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        List<Account> returnedAccounts = response.getBody();
        assertEquals(2, returnedAccounts.size());
        assertEquals(1, returnedAccounts.get(0).getBranchId());
        assertEquals(1, returnedAccounts.get(1).getBranchId());
    }

    @Test
    public void testGetAccounts_BranchOnlyFalse_ReturnsAllAccounts() {
        // Arrange
        when(accountRepository.findAll()).thenReturn(mockAccounts);

        // Act
        ResponseEntity<List<Account>> response = savingsController.getAccounts(request, false);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        List<Account> returnedAccounts = response.getBody();
        assertEquals(3, returnedAccounts.size());
    }
}
