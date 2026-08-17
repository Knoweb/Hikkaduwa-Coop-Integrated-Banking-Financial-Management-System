package com.hmcs.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

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

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);
                
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    
                    Integer tokenTenantId = jwtUtil.extractTenantId(token);
                    if (tokenTenantId != null) {
                        com.hmcs.auth.multitenancy.TenantContext.setTenantId(tokenTenantId);
                    }

                    // Verify that this token is the currently active token
                    java.util.Optional<com.hmcs.auth.entity.User> optUser = userRepository.findByUsername(username);
                            
                    if (optUser.isPresent()) {
                        String activeToken = optUser.get().getActiveToken();
                        if (activeToken != null && token.equals(activeToken)) {
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                            );
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        } else {
                            System.out.println("Concurrent session detected or activeToken is null. DB Token: " + activeToken + ", Received: " + token);
                        }
                    } else {
                        System.out.println("User not found in DB for username: " + username + " with tenantId: " + com.hmcs.auth.multitenancy.TenantContext.getTenantId());
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
