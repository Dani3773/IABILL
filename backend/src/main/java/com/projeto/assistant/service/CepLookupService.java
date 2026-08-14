package com.projeto.assistant.service;

import com.projeto.assistant.dto.CepLookupResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Consulta CEP via ViaCEP (viacep.com.br, gratuita, sem chave) - so cobre enderecos
 * brasileiros, ja que nao existe fonte publica unificada para codigos postais da UE.
 * Mesmo padrao de falha silenciosa do CnpjLookupService: nunca bloqueia o formulario.
 */
@Service
public class CepLookupService {

    private static final Logger log = LoggerFactory.getLogger(CepLookupService.class);

    private static final Map<String, String> UF_TO_STATE_NAME = Map.ofEntries(
            Map.entry("AC", "Acre"), Map.entry("AL", "Alagoas"), Map.entry("AP", "Amapá"),
            Map.entry("AM", "Amazonas"), Map.entry("BA", "Bahia"), Map.entry("CE", "Ceará"),
            Map.entry("DF", "Distrito Federal"), Map.entry("ES", "Espírito Santo"), Map.entry("GO", "Goiás"),
            Map.entry("MA", "Maranhão"), Map.entry("MT", "Mato Grosso"), Map.entry("MS", "Mato Grosso do Sul"),
            Map.entry("MG", "Minas Gerais"), Map.entry("PA", "Pará"), Map.entry("PB", "Paraíba"),
            Map.entry("PR", "Paraná"), Map.entry("PE", "Pernambuco"), Map.entry("PI", "Piauí"),
            Map.entry("RJ", "Rio de Janeiro"), Map.entry("RN", "Rio Grande do Norte"), Map.entry("RS", "Rio Grande do Sul"),
            Map.entry("RO", "Rondônia"), Map.entry("RR", "Roraima"), Map.entry("SC", "Santa Catarina"),
            Map.entry("SP", "São Paulo"), Map.entry("SE", "Sergipe"), Map.entry("TO", "Tocantins")
    );

    private final RestClient restClient;

    public CepLookupService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://viacep.com.br/ws")
                .build();
    }

    @SuppressWarnings("unchecked")
    public CepLookupResponseDTO lookup(String cep) {
        String sanitized = cep.replaceAll("[^0-9]", "");

        if (sanitized.length() != 8) {
            return new CepLookupResponseDTO(false, null, null, null, null);
        }

        try {
            Map<String, Object> response = restClient.get()
                    .uri("/{cep}/json/", sanitized)
                    .retrieve()
                    .body(Map.class);

            if (response == null || Boolean.TRUE.equals(response.get("erro"))) {
                return new CepLookupResponseDTO(false, null, null, null, null);
            }

            String uf = (String) response.get("uf");
            String stateName = UF_TO_STATE_NAME.getOrDefault(uf, uf);

            return new CepLookupResponseDTO(
                    true,
                    (String) response.get("logradouro"),
                    (String) response.get("bairro"),
                    (String) response.get("localidade"),
                    stateName
            );
        } catch (Exception e) {
            log.warn("Falha ao consultar CEP {} na ViaCEP: {}", sanitized, e.getMessage());
            return new CepLookupResponseDTO(false, null, null, null, null);
        }
    }
}