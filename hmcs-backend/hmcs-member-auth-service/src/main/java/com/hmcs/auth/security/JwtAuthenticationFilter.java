package com.hmcs.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final com.hmcs.auth.repository.UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, @org.springframework.context.annotation.Lazy com.hmcs.auth.repository.UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = null; if (request.getCookies() != null) { for (jakarta.servlet.http.Cookie cookie : request.getCookies()) { if ("jwt".equals(cookie.getName())) { token = cookie.getValue(); break; } } } if (token == null) { String authHeader = request.getHeader("Authorization"); if (authHeader != null && authHeader.startsWith("Bearer ")) { token = authHeader.substring(7); } } if (token != null) {
            try {
                String username = jwtUtil.extractUsername(token); System.out.println("Extracted username: " + username);
                String role = jwtUtil.extractRole(token);
                
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    
                    Integer tokenTenantId = jwtUtil.extractTenantId(token);
                    if (tokenTenantId != null) {
                        com.hmcs.auth.multitenancy.TenantContext.setTenantId(tokenTenantId);
                    }

                    // Verify that this token is the currently active token using native query to bypass @TenantId filter
                    String activeToken = null;
                    try {
                        activeToken = userRepository.findActiveTokenByUsernameBypassingTenant(username);
                    } catch (Exception e) {
                        // User not found or DB error
                    }

                    if (activeToken != null && token.equals(activeToken)) {
                        String authName = (role != null && role.startsWith("ROLE_")) ? role : "ROLE_" + (role != null ? role : "");
                        String rawRole = authName.replace("ROLE_", "");
                        List<GrantedAuthority> authorities = Arrays.asList(
                            new SimpleGrantedAuthority(authName),
                            new SimpleGrantedAuthority(rawRole)
                        );
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                username, null, authorities
                        );
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    } else {
                        System.out.println("Concurrent session detected or activeToken is null. DB Token: " + activeToken + ", Received: " + token);
                    }
                }
            } catch (Exception e) {
                // Invalid token
                System.out.println("Invalid JWT token: " + e.getMessage());
                e.printStackTrace();
            }
        }

        filterChain.doFilter(request, response);
    }
}


