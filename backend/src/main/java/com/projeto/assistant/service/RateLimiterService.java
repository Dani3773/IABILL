package com.projeto.assistant.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

// Rate limiting EM MEMORIA (adequado para uma unica instancia do backend).
// Se o projeto escalar para multiplas instancias no futuro, sera necessario
// migrar para um bucket compartilhado (ex: Redis) - anotado na tasklist.
@Service
public class RateLimiterService {

    // Configuravel via propriedade - producao usa 30 (padrao real, protege custo
    // de API), o profile de teste de avaliacao (golden dataset) usa um valor
    // maior, ja que uma unica execucao do teste faz muito mais chamadas de IA
    // do que um usuario real faria numa hora.
    @Value("${app.rate-limit.ai-actions-per-hour:30}")
    private int maxAiActionsPerHour;

    private static final int MAX_FAILED_LOGINS = 10;
    private static final Duration FAILED_LOGIN_WINDOW = Duration.ofMinutes(15);

    private final ConcurrentHashMap<UUID, Bucket> buckets = new ConcurrentHashMap<>();

    // O login e publico: com expiracao e teto de tamanho, e-mails inventados em
    // massa nao fazem a memoria crescer sem limite.
    private final Cache<String, Bucket> failedLoginBuckets = Caffeine.newBuilder()
            .expireAfterAccess(FAILED_LOGIN_WINDOW.multipliedBy(2))
            .maximumSize(100_000)
            .build();

    // Cada chamada consome 1 "token" do usuario. Se nao houver token disponivel,
    // lanca excecao - a acao de IA (geracao, chat, embeddings) NAO e executada.
    public void checkAiUsageLimit(UUID userId) {
        Bucket bucket = buckets.computeIfAbsent(userId, id -> createNewBucket());

        if (!bucket.tryConsume(1)) {
            throw new RateLimitExceededException(
                    "Limite de uso de IA atingido (" + maxAiActionsPerHour + " ações por hora). Tente novamente mais tarde.");
        }
    }

    // Conta apenas tentativas que falharam, por e-mail, e o token volta aos poucos:
    // terceiros nao conseguem manter uma conta bloqueada por muito tempo.
    public void checkLoginAllowed(String email) {
        Bucket bucket = failedLoginBuckets.getIfPresent(normalize(email));

        if (bucket != null && bucket.getAvailableTokens() <= 0) {
            throw new RateLimitExceededException("Muitas tentativas de login. Aguarde alguns minutos e tente novamente.");
        }
    }

    public void recordFailedLogin(String email) {
        failedLoginBuckets.get(normalize(email), key -> createFailedLoginBucket()).tryConsume(1);
    }

    public void clearFailedLogins(String email) {
        failedLoginBuckets.invalidate(normalize(email));
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private Bucket createFailedLoginBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_FAILED_LOGINS)
                .refillGreedy(MAX_FAILED_LOGINS, FAILED_LOGIN_WINDOW)
                .build();

        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(maxAiActionsPerHour)
                .refillGreedy(maxAiActionsPerHour, Duration.ofHours(1))
                .build();

        return Bucket.builder().addLimit(limit).build();
    }
}