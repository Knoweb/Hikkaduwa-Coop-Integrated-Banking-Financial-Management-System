package com.hmcs.loan.security;

import com.hmcs.loan.entity.Loan;
import com.hmcs.loan.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service("loanSecurityService")
public class LoanSecurityService {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoanRepository loanRepository;

    public boolean canAccessBranch(Integer requestedBranchId, org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String role = auth.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("");

        if (role.contains("ORGANIZATION_ADMIN") || role.contains("PLATFORM_ADMIN")) {
            return true;
        }

        // We can extract branchId from the details or query the DB. Since we are in microservices,
        // it's easier to extract it from the Jwt token. If auth.getCredentials() has the token:
        String token = auth.getCredentials().toString();
        Integer userBranchId = jwtUtil.extractBranchId(token);
        return userBranchId != null && userBranchId.equals(requestedBranchId);
    }

    public boolean canAccessLoan(UUID loanId, org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String role = auth.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("");

        if (role.contains("ORGANIZATION_ADMIN") || role.contains("PLATFORM_ADMIN")) {
            return true;
        }

        Optional<Loan> loanOpt = loanRepository.findById(loanId);
        if (loanOpt.isEmpty()) return true;

        String token = auth.getCredentials().toString();
        Integer userBranchId = jwtUtil.extractBranchId(token);
        Integer loanBranchId = loanOpt.get().getBranchId();

        return userBranchId != null && userBranchId.equals(loanBranchId);
    }
}
