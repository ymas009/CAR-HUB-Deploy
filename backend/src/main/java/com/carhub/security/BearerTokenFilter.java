package com.carhub.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class BearerTokenFilter extends OncePerRequestFilter {
    private final TokenService tokenService;
    private final AuthSessionRepository authSessionRepository;

    public BearerTokenFilter(TokenService tokenService, AuthSessionRepository authSessionRepository) {
        this.tokenService = tokenService;
        this.authSessionRepository = authSessionRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                AuthenticatedUser user = tokenService.parse(header.substring(7));
                boolean activeSession = authSessionRepository.findById(user.sessionId())
                        .map(AuthSession::isActive)
                        .orElse(false);
                if (!activeSession) {
                    throw new IllegalArgumentException("Revoked session");
                }
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        user.roles().stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role.name())).toList()
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
