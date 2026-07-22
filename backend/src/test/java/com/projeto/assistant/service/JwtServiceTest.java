package com.projeto.assistant.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // ReflectionTestUtils simula o que o @Value faria em tempo de execucao real,
        // ja que aqui criamos o service manualmente, sem o contexto do Spring.
        ReflectionTestUtils.setField(jwtService, "secret", "chave-de-teste-so-para-unit-tests-1234567890");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3600000L);
    }

    @Test
    void generateToken_thenExtractClaims_shouldMatchOriginalValues() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        String role = "ADMIN";

        String token = jwtService.generateToken(userId, tenantId, role);

        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
        assertThat(jwtService.extractTenantId(token)).isEqualTo(tenantId);
        assertThat(jwtService.extractRole(token)).isEqualTo(role);
    }

    @Test
    void isTokenValid_withGarbageString_shouldReturnFalse() {
        assertThat(jwtService.isTokenValid("token.invalido.aqui")).isFalse();
    }
}