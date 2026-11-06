package com.projeto.assistant.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
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
}
