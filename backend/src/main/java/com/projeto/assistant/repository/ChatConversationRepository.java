package com.projeto.assistant.repository;

import com.projeto.assistant.model.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, UUID> {

    List<ChatConversation> findByWorkspaceIdAndUserIdOrderByUpdatedAtDesc(UUID workspaceId, UUID userId);
}