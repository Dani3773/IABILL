package com.projeto.assistant.repository;

import com.projeto.assistant.model.Sector;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SectorRepository extends JpaRepository<Sector, UUID> {
    List<Sector> findByWorkspaceId(UUID workspaceId);
}