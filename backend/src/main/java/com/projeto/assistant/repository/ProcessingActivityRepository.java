package com.projeto.assistant.repository;

import com.projeto.assistant.model.ProcessingActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProcessingActivityRepository extends JpaRepository<ProcessingActivity, UUID> {
    List<ProcessingActivity> findByWorkspaceId(UUID workspaceId);
}