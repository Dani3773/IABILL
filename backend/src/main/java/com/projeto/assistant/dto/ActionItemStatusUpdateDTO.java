package com.projeto.assistant.dto;

import com.projeto.assistant.model.ActionItemStatus;
import jakarta.validation.constraints.NotNull;

public record ActionItemStatusUpdateDTO(
        @NotNull(message = "O status é obrigatório")
        ActionItemStatus status
) {
}