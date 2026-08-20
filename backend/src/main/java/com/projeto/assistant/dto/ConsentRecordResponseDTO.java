package com.projeto.assistant.dto;

import com.projeto.assistant.model.ConsentRecord;

import java.time.Instant;
import java.util.UUID;

public record ConsentRecordResponseDTO(
        UUID id,
        String consenterName,
        String consenterEmail,
        Instant consentedAt,
        String ipAddress
) {
    public static ConsentRecordResponseDTO fromEntity(ConsentRecord record) {
        return new ConsentRecordResponseDTO(
                record.getId(),
                record.getConsenterName(),
                record.getConsenterEmail(),
                record.getConsentedAt(),
                record.getIpAddress()
        );
    }
}