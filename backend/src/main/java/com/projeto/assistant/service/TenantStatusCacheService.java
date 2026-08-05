package com.projeto.assistant.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.projeto.assistant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

// Cache em memoria (60s) do status ativo/inativo de cada tenant - evita consultar
// o banco em TODA requisicao autenticada, mantendo desativacao quase-imediata
// (efeito em ate 60s, nao 24h como seria so checando no login).
@Service
@RequiredArgsConstructor
public class TenantStatusCacheService {

    private final TenantRepository tenantRepository;

    private final Cache<UUID, Boolean> cache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(60))
            .maximumSize(10_000)
            .build();

    public boolean isActive(UUID tenantId) {
        return cache.get(tenantId, id -> tenantRepository.findById(id)
                .map(com.projeto.assistant.model.Tenant::isActive)
                .orElse(false));
    }

    // Chamado pelo PlatformService sempre que um tenant muda de status,
    // para o efeito nao precisar esperar os 60s do cache expirar sozinho.
    public void invalidate(UUID tenantId) {
        cache.invalidate(tenantId);
    }
}