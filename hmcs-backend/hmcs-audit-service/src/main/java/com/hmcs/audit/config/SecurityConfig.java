package com.hmcs.audit.config;

import com.hmcs.audit.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        org.springframework.security.web.csrf.CookieCsrfTokenRepository tokenRepository = org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse();
        tokenRepository.setCookiePath("/");
        
        org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler requestHandler = new org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);
        
        http.csrf(csrf -> csrf.csrfTokenRepository(tokenRepository)
                              .csrfTokenRequestHandler(requestHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/fixed-deposits/admin/fix-fd-interest").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterAfter(new org.springframework.web.filter.OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response, jakarta.servlet.FilterChain filterChain) throws jakarta.servlet.ServletException, java.io.IOException {
                    org.springframework.security.web.csrf.CsrfToken csrfToken = (org.springframework.security.web.csrf.CsrfToken) request.getAttribute(org.springframework.security.web.csrf.CsrfToken.class.getName());
                    if (csrfToken != null) {
                        csrfToken.getToken(); // forces the token to be rendered in the cookie
                    }
                    filterChain.doFilter(request, response);
                }
            }, org.springframework.security.web.csrf.CsrfFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}


