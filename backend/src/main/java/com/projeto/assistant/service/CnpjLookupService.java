package com.projeto.assistant.service;

import com.projeto.assistant.dto.CnpjLookupResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Consulta dados publicos de CNPJ via BrasilAPI (sem necessidade de chave/cadastro).
 * Usado para autopreencher o nome da empresa no formulario de cadastro (nice-to-have,
 * NUNCA bloqueia o signup - qualquer falha de rede, CNPJ invalido, ou indisponibilidade
 * da API externa retorna "not found" em vez de propagar excecao, diferente do padrao
 * usado nos services do Gemini, onde a IA e essencial ao fluxo).
 */
@Service
public class CnpjLookupService {

    private static final Logger log = LoggerFactory.getLogger(CnpjLookupService.class);

    private final RestClient restClient;

    public CnpjLookupService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://brasilapi.com.br/api/cnpj/v1")
                .build();
    }

    @SuppressWarnings("unchecked")
    public CnpjLookupResponseDTO lookup(String cnpj) {
        String sanitized = cnpj.replaceAll("[^0-9]", "");

        if (sanitized.length() != 14) {
            return new CnpjLookupResponseDTO(false, null);
        }

        try {
            Map<String, Object> response = restClient.get()
                    .uri("/{cnpj}", sanitized)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                return new CnpjLookupResponseDTO(false, null);
            }

            // BrasilAPI retorna "razao_social" (nome oficial) - preferimos esse sobre
            // "nome_fantasia" por ser o dado juridicamente formal, mais adequado para
            // o campo de nome do Tenant.
            String name = (String) response.get("razao_social");
            if (name == null || name.isBlank()) {
                return new CnpjLookupResponseDTO(false, null);
            }

            return new CnpjLookupResponseDTO(true, name);
        } catch (Exception e) {
            // Falha silenciosa deliberada: CNPJ nao encontrado (404), API fora do ar,
            // timeout, etc. - todos tratados igual, pois esta consulta e so um
            // autopreenchimento opcional durante o cadastro.
            log.warn("Falha ao consultar CNPJ {} na BrasilAPI: {}", sanitized, e.getMessage());
            return new CnpjLookupResponseDTO(false, null);
        }
    }
}