package com.hmcs.audit.security;

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

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
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
                    String authName = (role != null && role.startsWith("ROLE_")) ? role : "ROLE_" + (role != null ? role : "");
                    String rawRole = authName.replace("ROLE_", "");
                    java.util.List<org.springframework.security.core.GrantedAuthority> authorities = java.util.Arrays.asList(
                        new SimpleGrantedAuthority(authName),
                        new SimpleGrantedAuthority(rawRole)
                    );
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                // Invalid token
                System.out.println("Invalid JWT token: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
