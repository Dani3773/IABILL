package com.projeto.assistant.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    @RestController
    static class SampleController {
        record Payload(String name) {
        }

        @GetMapping("/items/{id}")
        String byId(@PathVariable UUID id) {
            return id.toString();
        }

        @GetMapping("/search")
        String search(@RequestParam String term) {
            return term;
        }

        @GetMapping("/ai/{status}")
        String aiFailure(@PathVariable int status) {
            throw HttpClientErrorException.create(HttpStatusCode.valueOf(status), "falha", null, null, null);
        }

        @PostMapping("/items")
        String create(@RequestBody Payload payload) {
            return payload.name();
        }
    }

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new SampleController())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

    @Test
    void corpoQueNaoEJsonRetorna400() throws Exception {
        mvc.perform(post("/items").contentType(MediaType.APPLICATION_JSON).content("nao-json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void identificadorMalformadoRetorna400() throws Exception {
        mvc.perform(get("/items/nao-uuid")).andExpect(status().isBadRequest());
    }

    @Test
    void parametroAusenteRetorna400() throws Exception {
        mvc.perform(get("/search")).andExpect(status().isBadRequest());
    }

    @Test
    void cotaDaIaEsgotadaRetorna429ComMotivo() throws Exception {
        mvc.perform(get("/ai/429"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("O serviço de IA atingiu o limite de uso. Tente novamente mais tarde."));
    }

    @Test
    void chaveDaIaRecusadaRetorna503ComMotivo() throws Exception {
        mvc.perform(get("/ai/403"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("O serviço de IA recusou a chave de acesso. Verifique a configuração."));
    }

    @Test
    void iaForaDoArRetorna503ComMotivo() throws Exception {
        mvc.perform(get("/ai/503"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("O serviço de IA está indisponível no momento. Tente novamente em instantes."));
    }
}
