package com.projeto.assistant.dto;

import com.projeto.assistant.model.ActionItemSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ActionItemRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        @NotBlank(message = "O título é obrigatório")
        String title,

        String description,

        // Opcional: se omitido, assume MANUAL. Usado quando o frontend "aprova"
        // uma sugestao de IA e a transforma numa tarefa de verdade.
        ActionItemSource source
) {
}