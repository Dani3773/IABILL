package com.projeto.assistant.repository;

import com.projeto.assistant.model.DataSubjectRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DataSubjectRequestRepository extends JpaRepository<DataSubjectRequest, UUID> {

    List<DataSubjectRequest> findByWorkspaceId(UUID workspaceId);
}