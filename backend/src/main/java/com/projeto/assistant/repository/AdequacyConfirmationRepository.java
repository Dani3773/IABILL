package com.projeto.assistant.repository;

import com.projeto.assistant.model.AdequacyConfirmation;
import com.projeto.assistant.model.AdequacyItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdequacyConfirmationRepository extends JpaRepository<AdequacyConfirmation, UUID> {
    List<AdequacyConfirmation> findByWorkspaceId(UUID workspaceId);

    Optional<AdequacyConfirmation> findByWorkspaceIdAndItem(UUID workspaceId, AdequacyItem item);
}
