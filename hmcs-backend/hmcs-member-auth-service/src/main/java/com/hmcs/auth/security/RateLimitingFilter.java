package com.hmcs.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static class RequestCount {
        long startTime = System.currentTimeMillis();
        AtomicInteger count = new AtomicInteger(1);
    }

    private final ConcurrentHashMap<String, RequestCount> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 15;
    private static final long TIME_WINDOW_MS = 60000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        
        if (path.equals("/api/v1/auth/login") || 
            path.equals("/api/v1/auth/verify-otp") || 
            path.equals("/api/v1/auth/forgot-password")) {

            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            } else {
                ip = ip.split(",")[0].trim();
            }

            long currentTime = System.currentTimeMillis();
            
            requestCounts.compute(ip, (key, reqCount) -> {
                if (reqCount == null || (currentTime - reqCount.startTime) > TIME_WINDOW_MS) {
                    return new RequestCount();
                }
                reqCount.count.incrementAndGet();
                return reqCount;
            });

            RequestCount reqCount = requestCounts.get(ip);
            
            if (reqCount.count.get() > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(429); // HttpStatus.TOO_MANY_REQUESTS
                response.setContentType("application/json");
                response.getWriter().write("{\"message\": \"Too many login attempts from your IP. Please try again in a minute.\"}");
                return; // Block request
            }
        }

        filterChain.doFilter(request, response);
    }
}
