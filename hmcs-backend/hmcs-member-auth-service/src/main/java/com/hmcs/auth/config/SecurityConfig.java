package com.hmcs.auth.config;

import com.hmcs.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/login", "/api/v1/auth/seed", "/api/v1/auth/seed-admin", "/api/v1/auth/setup-mfa", "/api/v1/auth/verify-otp").permitAll()
                // Allow branch staff to view users for assignment purposes
                .requestMatchers(HttpMethod.GET, "/api/v1/auth/users", "/api/v1/auth/users/").hasAnyAuthority("ROLE_ORGANIZATION_ADMIN", "ROLE_BRANCH_MANAGER", "ROLE_SENIOR_OFFICER", "ROLE_PLATFORM_ADMIN", "ROLE_AUDITOR")
                
                // Strictly lock the user management APIs to ORGANIZATION_ADMIN and PLATFORM_ADMIN
                .requestMatchers("/api/v1/auth/users/**").hasAnyAuthority("ROLE_ORGANIZATION_ADMIN", "ROLE_PLATFORM_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/auth/branches", "/api/v1/auth/branches/**").authenticated()
                .requestMatchers("/api/v1/auth/branches", "/api/v1/auth/branches/**").hasAnyAuthority("ROLE_ORGANIZATION_ADMIN", "ROLE_PLATFORM_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
}
