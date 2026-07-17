package com.projeto.assistant.service;

import com.projeto.assistant.dto.TenantRequestDTO;
import com.projeto.assistant.dto.TenantResponseDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantResponseDTO create(TenantRequestDTO request) {
        Tenant tenant = new Tenant();
        tenant.setName(request.name());
        tenant.setDocumentId(request.documentId());
        tenant.setCountry(request.country());

        Tenant saved = tenantRepository.save(tenant);
        return TenantResponseDTO.fromEntity(saved);
    }

    public List<TenantResponseDTO> findAll() {
        return tenantRepository.findAll()
                .stream()
                .map(TenantResponseDTO::fromEntity)
                .toList();
    }

    public TenantResponseDTO findById(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + id));
        return TenantResponseDTO.fromEntity(tenant);
    }
}