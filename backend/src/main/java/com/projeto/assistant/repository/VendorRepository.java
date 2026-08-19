package com.projeto.assistant.repository;

import com.projeto.assistant.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VendorRepository extends JpaRepository<Vendor, UUID> {
    List<Vendor> findByWorkspaceId(UUID workspaceId);
}