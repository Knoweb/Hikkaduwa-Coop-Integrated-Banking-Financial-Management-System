package com.hmcs.pawning.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                Claims claims = jwtUtils.getClaimsFromJwtToken(jwt);
                String username = claims.getSubject();
                String role = claims.get("role", String.class);
                
                System.out.println("[AUTH FILTER] JWT Token validated for user: " + username + ", role: " + role);
                
                // Safely extract branchId regardless of whether it's stored as Integer or Long in JWT
                Object branchIdObj = claims.get("branchId");
                Long branchId = null;
                if (branchIdObj instanceof Number) {
                    branchId = ((Number) branchIdObj).longValue();
                }

                List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
                System.out.println("[AUTH FILTER] Created authority: " + authorities.iterator().next().getAuthority());

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);
                
                // Store branchId in details
                authentication.setDetails(branchId);

                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("[AUTH FILTER] Authentication set for user: " + username);
            } else {
                System.out.println("[AUTH FILTER] JWT validation failed or JWT is null");
            }
        } catch (Exception e) {
            System.err.println("Cannot set user authentication: " + e);
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}

