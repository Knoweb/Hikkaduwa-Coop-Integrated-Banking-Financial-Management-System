package com.hmcs.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * BranchContext - MANDATORY for every API endpoint.
 *
 * RULE: branch_id is ALWAYS extracted from the JWT token on the server side.
 *       It is NEVER read from request params or request body.
 *       This prevents cross-branch data leakage.
 *
 * Usage in any @RestController:
 *   @Autowired BranchContext branchContext;
 *
 *   @GetMapping("/accounts")
 *   public List<Account> getAccounts(HttpServletRequest request) {
 *       Integer branchId = branchContext.extractBranchId(request);
 *       return accountRepository.findByBranchId(branchId); // branch-filtered!
 *   }
 */
@Component
public class BranchContext {

    private final JwtUtil jwtUtil;

    public BranchContext(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        throw new RuntimeException("No Authorization header found");
    }

    public Integer extractBranchId(HttpServletRequest request) {
        return jwtUtil.extractBranchId(getTokenFromRequest(request));
    }

    public String extractRole(HttpServletRequest request) {
        return jwtUtil.extractRole(getTokenFromRequest(request));
    }

    public String extractUsername(HttpServletRequest request) {
        return jwtUtil.extractUsername(getTokenFromRequest(request));
    }
}
