package com.hmcs.pawning.security;

import com.hmcs.pawning.entity.PawnTicket;
import com.hmcs.pawning.repository.PawnTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service("pawningSecurityService")
public class PawningSecurityService {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PawnTicketRepository pawnTicketRepository;

    public boolean canAccessBranch(Integer requestedBranchId, org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String role = auth.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("");

        if (role.contains("ORGANIZATION_ADMIN") || role.contains("PLATFORM_ADMIN")) {
            return true;
        }

        String token = auth.getCredentials().toString();
        Integer userBranchId = jwtUtil.extractBranchId(token);
        return userBranchId != null && userBranchId.equals(requestedBranchId);
    }

    public boolean canAccessTicket(UUID ticketId, org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String role = auth.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("");

        if (role.contains("ORGANIZATION_ADMIN") || role.contains("PLATFORM_ADMIN")) {
            return true;
        }

        Optional<PawnTicket> ticketOpt = pawnTicketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) return true;

        String token = auth.getCredentials().toString();
        Integer userBranchId = jwtUtil.extractBranchId(token);
        Integer ticketBranchId = ticketOpt.get().getBranchId();

        return userBranchId != null && userBranchId.equals(ticketBranchId);
    }
}
