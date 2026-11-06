package com.projeto.assistant.config;

import tools.jackson.databind.ObjectMapper;
import com.projeto.assistant.dto.ErrorResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponseDTO body = new ErrorResponseDTO(
                Instant.now(),
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                MessageCatalog.t("Token de autenticação ausente ou inválido"),
                request.getRequestURI()
        );

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}