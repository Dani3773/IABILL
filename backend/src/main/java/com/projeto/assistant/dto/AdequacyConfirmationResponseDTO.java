package com.projeto.assistant.dto;

import com.projeto.assistant.model.AdequacyConfirmation;
import com.projeto.assistant.model.AdequacyItem;

import java.time.Instant;

public record AdequacyConfirmationResponseDTO(
        AdequacyItem item,
        String confirmedByName,
        Instant confirmedAt
) {
    public static AdequacyConfirmationResponseDTO fromEntity(AdequacyConfirmation confirmation) {
        return new AdequacyConfirmationResponseDTO(
                confirmation.getItem(),
                confirmation.getConfirmedBy().getUsername(),
                confirmation.getConfirmedAt()
        );
    }
}
