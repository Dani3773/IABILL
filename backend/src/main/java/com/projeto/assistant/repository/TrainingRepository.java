package com.projeto.assistant.repository;

import com.projeto.assistant.model.Training;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrainingRepository extends JpaRepository<Training, UUID> {
    List<Training> findByWorkspaceId(UUID workspaceId);
}