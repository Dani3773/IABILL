package com.projeto.assistant.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
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

    private final ConcurrentHashMap<UUID, Bucket> buckets = new ConcurrentHashMap<>();

    // Cada chamada consome 1 "token" do usuario. Se nao houver token disponivel,
    // lanca excecao - a acao de IA (geracao, chat, embeddings) NAO e executada.
    public void checkAiUsageLimit(UUID userId) {
        Bucket bucket = buckets.computeIfAbsent(userId, id -> createNewBucket());

        if (!bucket.tryConsume(1)) {
            throw new RateLimitExceededException(
                    "Limite de uso de IA atingido (" + maxAiActionsPerHour + " ações por hora). Tente novamente mais tarde.");
        }
    }

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(maxAiActionsPerHour)
                .refillGreedy(maxAiActionsPerHour, Duration.ofHours(1))
                .build();

        return Bucket.builder().addLimit(limit).build();
    }
}