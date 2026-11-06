package com.projeto.assistant.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MessageCatalogTest {

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    private void requestWithLanguage(String language) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Accept-Language", language);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @Test
    void semPedidoMantemPortuguesDoBrasil() {
        assertEquals("E-mail inválido", MessageCatalog.t("E-mail inválido"));
    }

    @Test
    void portuguesDoBrasilNaoPassaPeloCatalogo() {
        requestWithLanguage("pt-BR");
        assertEquals("E-mail ou senha inválidos", MessageCatalog.t("E-mail ou senha inválidos"));
    }

    @Test
    void traduzMensagemExata() {
        requestWithLanguage("en");
        assertEquals("Invalid email or password", MessageCatalog.t("E-mail ou senha inválidos"));

        requestWithLanguage("pt-PT");
        assertEquals("E-mail ou palavra-passe inválidos", MessageCatalog.t("E-mail ou senha inválidos"));
    }

    @Test
    void preservaTrechoVariavel() {
        requestWithLanguage("en");
        assertEquals("Unit not found: abc-123", MessageCatalog.t("Workspace não encontrado: abc-123"));
        assertEquals("AI usage limit reached (20 actions per hour). Try again later.",
                MessageCatalog.t("Limite de uso de IA atingido (20 ações por hora). Tente novamente mais tarde."));
    }

    @Test
    void mensagemSemTraducaoSaiComoEsta() {
        requestWithLanguage("en");
        assertEquals("Texto sem tradução", MessageCatalog.t("Texto sem tradução"));
    }

    @Test
    void interpretaCabecalhoDoNavegador() {
        assertEquals("pt-BR", MessageCatalog.resolveLanguage(null));
        assertEquals("pt-BR", MessageCatalog.resolveLanguage("pt-BR,pt;q=0.9"));
        assertEquals("pt-PT", MessageCatalog.resolveLanguage("pt-PT"));
        assertEquals("en", MessageCatalog.resolveLanguage("en-US,en;q=0.9"));
        assertEquals("en", MessageCatalog.resolveLanguage("de"));
    }

    @Test
    void instrucaoDaIaSegueOIdioma() {
        requestWithLanguage("en");
        assertTrue(MessageCatalog.aiLanguageInstruction().contains("inglês"));

        requestWithLanguage("pt-PT");
        assertTrue(MessageCatalog.aiLanguageInstruction().contains("Portugal"));
    }
}
