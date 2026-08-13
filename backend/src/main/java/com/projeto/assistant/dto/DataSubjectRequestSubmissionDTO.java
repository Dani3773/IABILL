package com.projeto.assistant.dto;

import com.projeto.assistant.model.DataSubjectRequestType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DataSubjectRequestSubmissionDTO(
        @NotBlank String requesterName,
        @NotBlank @Email String requesterEmail,
        String requesterDocumentId,
        @NotNull DataSubjectRequestType requestType,
        @NotBlank String description
) {
}