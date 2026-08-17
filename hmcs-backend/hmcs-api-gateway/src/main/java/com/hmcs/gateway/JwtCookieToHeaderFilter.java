package com.hmcs.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Component
public class JwtCookieToHeaderFilter implements GlobalFilter, Ordered {

    private final WebClient webClient;

    public JwtCookieToHeaderFilter(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://hmcs-member-auth-service:8081").build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // Check if there is already an Authorization header
        if (!request.getHeaders().containsKey("Authorization")) {
            HttpCookie jwtCookie = request.getCookies().getFirst("jwt_token");
            if (jwtCookie != null && jwtCookie.getValue() != null && !jwtCookie.getValue().isEmpty()) {
                String token = jwtCookie.getValue();
                
                // Skip validation for auth endpoints (login, logout, etc) to prevent loops
                if (request.getURI().getPath().startsWith("/api/v1/auth/")) {
                    ServerHttpRequest mutatedRequest = request.mutate()
                            .header("Authorization", "Bearer " + token)
                            .build();
                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                }

                // Validate token with Auth Service
                return webClient.get()
                        .uri("/api/v1/auth/validate")
                        .header("Authorization", "Bearer " + token)
                        .retrieve()
                        .toBodilessEntity()
                        .flatMap(response -> {
                            if (response.getStatusCode().is2xxSuccessful()) {
                                ServerHttpRequest mutatedRequest = request.mutate()
                                        .header("Authorization", "Bearer " + token)
                                        .build();
                                return chain.filter(exchange.mutate().request(mutatedRequest).build());
                            } else {
                                return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired session"));
                            }
                        })
                        .onErrorResume(e -> Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session validation failed")));
            }
        }
        
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1; // Run early in the chain
    }
}
