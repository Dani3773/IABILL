package com.projeto.assistant.config;

import com.projeto.assistant.service.JwtService;
import com.projeto.assistant.service.TenantStatusCacheService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TenantStatusCacheService tenantStatusCacheService;

    private static final String COOKIE_NAME = "auth_token";

    public static final String ATTR_USER_ID = "authUserId";
    public static final String ATTR_TENANT_ID = "authTenantId";
    public static final String ATTR_ROLE = "authRole";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && jwtService.isTokenValid(token)) {
            UUID userId = jwtService.extractUserId(token);
            UUID tenantId = jwtService.extractTenantId(token);
            String role = jwtService.extractRole(token);

            // Bloqueia o acesso se o tenant foi desativado por um Super-Admin -
            // efeito em ate 60s (ver TenantStatusCacheService), nao precisa
            // esperar o token expirar (ate 24h). Super-Admin sem tenant
            // (tenantId == null) nunca e bloqueado por essa checagem.
            boolean tenantBlocked = tenantId != null && !tenantStatusCacheService.isActive(tenantId);
            if (tenantBlocked) {
                // Resposta especifica em vez de cair no 401 generico, permite ao
                // frontend distinguir "empresa desativada" de "sessao expirada",
                // ao inves de mostrar o mesmo erro confuso nos dois casos.
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\":\"TENANT_SUSPENDED\",\"message\":\"Esta empresa foi desativada, entre em contato com o suporte.\"}");
                return;
            }
            request.setAttribute(ATTR_USER_ID, userId);
            request.setAttribute(ATTR_TENANT_ID, tenantId);
            request.setAttribute(ATTR_ROLE, role);
            var authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    buildAuthorities(role)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }

    private List<SimpleGrantedAuthority> buildAuthorities(String role) {
        if ("SUPER_ADMIN".equals(role)) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"),
                    new SimpleGrantedAuthority("ROLE_ADMIN")
            );
        }
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}