package com.projeto.assistant.repository;

import com.projeto.assistant.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.projeto.assistant.dto.PlatformTenantSummaryDTO;

import java.util.List;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    @Query("""
    SELECT new com.projeto.assistant.dto.PlatformTenantSummaryDTO(
        t.id, t.name, t.documentId, t.country, t.createdAt,
        (SELECT COUNT(u) FROM User u WHERE u.tenant = t),
        (SELECT COUNT(w) FROM Workspace w WHERE w.tenant = t),
        (SELECT COUNT(d) FROM Document d WHERE d.workspace.tenant = t),
        t.active
    )
    FROM Tenant t
    ORDER BY t.createdAt DESC
    """)
    List<PlatformTenantSummaryDTO> findAllWithStats();

}