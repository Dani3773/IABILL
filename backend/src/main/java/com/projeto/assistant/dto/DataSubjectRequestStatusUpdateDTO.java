package com.projeto.assistant.dto;

import com.projeto.assistant.model.DataSubjectRequestStatus;
import jakarta.validation.constraints.NotNull;

public record DataSubjectRequestStatusUpdateDTO(
        @NotNull DataSubjectRequestStatus status,
        String rejectionReason
) {
}