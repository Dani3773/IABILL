package com.projeto.assistant.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

// Rate limiting EM MEMORIA (adequado para uma unica instancia do backend).
// Se o projeto escalar para multiplas instancias no futuro, sera necessario
// migrar para um bucket compartilhado (ex: Redis) - anotado na tasklist.
@Service
public class RateLimiterService {

    private static final int MAX_AI_ACTIONS_PER_HOUR = 30;

    private final ConcurrentHashMap<UUID, Bucket> buckets = new ConcurrentHashMap<>();

    // Cada chamada consome 1 "token" do usuario. Se nao houver token disponivel,
    // lanca excecao - a acao de IA (geracao, chat, embeddings) NAO e executada.
    public void checkAiUsageLimit(UUID userId) {
        Bucket bucket = buckets.computeIfAbsent(userId, id -> createNewBucket());

        if (!bucket.tryConsume(1)) {
            throw new RateLimitExceededException(
                    "Limite de uso de IA atingido (" + MAX_AI_ACTIONS_PER_HOUR + " ações por hora). Tente novamente mais tarde.");
        }
    }

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_AI_ACTIONS_PER_HOUR)
                .refillGreedy(MAX_AI_ACTIONS_PER_HOUR, Duration.ofHours(1))
                .build();

        return Bucket.builder().addLimit(limit).build();
    }
}