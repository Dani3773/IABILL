package com.projeto.assistant.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

// Impede que o sistema rode em produção com configuração de desenvolvimento.
// Sem as variáveis de ambiente, o application.yml cai num segredo JWT conhecido
// (qualquer um forjaria sessões) e em cookie sem a flag Secure. Antes isso subia
// sem aviso; agora a aplicação se recusa a iniciar e diz o que falta.
//
// "Produção" = banco fora da própria máquina. Em desenvolvimento e nos testes o
// banco é local (localhost/Testcontainers), e a verificação não se aplica.
@Configuration
public class ProductionConfigGuard {

    static final String DEV_JWT_SECRET = "dev-only-secret-troque-isso-em-producao-1234567890abcdef";
    private static final Logger log = LoggerFactory.getLogger(ProductionConfigGuard.class);

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    // Saída de emergência: APP_ALLOW_INSECURE_CONFIG=true deixa subir mesmo assim,
    // registrando o problema no log. Só para recuperar um ambiente, nunca como padrão.
    @Value("${app.security.allow-insecure-config:false}")
    private boolean allowInsecureConfig;

    @PostConstruct
    void check() {
        if (!isRemoteDatabase(datasourceUrl)) {
            return;
        }
        List<String> problems = findProblems(jwtSecret, cookieSecure);
        if (problems.isEmpty()) {
            return;
        }
        String message = "Configuração insegura para produção: " + String.join("; ", problems);
        if (allowInsecureConfig) {
            log.error("{} (APP_ALLOW_INSECURE_CONFIG ativo, iniciando mesmo assim)", message);
            return;
        }
        throw new IllegalStateException(message);
    }

    static boolean isRemoteDatabase(String url) {
        if (url == null) {
            return false;
        }
        String lower = url.toLowerCase();
        return !(lower.contains("//localhost") || lower.contains("//127.0.0.1") || lower.contains("//[::1]"));
    }

    static List<String> findProblems(String jwtSecret, boolean cookieSecure) {
        List<String> problems = new ArrayList<>();
        if (jwtSecret == null || jwtSecret.equals(DEV_JWT_SECRET) || jwtSecret.length() < 32) {
            problems.add("defina JWT_SECRET com um valor próprio de pelo menos 32 caracteres");
        }
        if (!cookieSecure) {
            problems.add("defina COOKIE_SECURE=true para o cookie de sessão só trafegar por HTTPS");
        }
        return problems;
    }
}
