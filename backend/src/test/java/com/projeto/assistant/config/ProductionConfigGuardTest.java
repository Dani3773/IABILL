package com.projeto.assistant.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProductionConfigGuardTest {

    @Test
    void bancoLocalNaoEhProducao() {
        assertThat(ProductionConfigGuard.isRemoteDatabase("jdbc:postgresql://localhost:5432/lgpd_assistant")).isFalse();
        assertThat(ProductionConfigGuard.isRemoteDatabase("jdbc:postgresql://127.0.0.1:55432/test")).isFalse();
    }

    @Test
    void bancoRemotoEhProducao() {
        assertThat(ProductionConfigGuard.isRemoteDatabase("jdbc:postgresql://iabill.xxxx.sa-east-1.rds.amazonaws.com:5432/iabill")).isTrue();
    }

    @Test
    void segredoPadraoECookieInseguroSaoApontados() {
        assertThat(ProductionConfigGuard.findProblems(ProductionConfigGuard.DEV_JWT_SECRET, false)).hasSize(2);
        assertThat(ProductionConfigGuard.findProblems("curto", true)).hasSize(1);
    }

    @Test
    void configuracaoCorretaPassa() {
        assertThat(ProductionConfigGuard.findProblems("um-segredo-proprio-com-mais-de-32-caracteres", true)).isEmpty();
    }
}
