package com.projeto.assistant.service;

import com.projeto.assistant.dto.VendorRequestDTO;
import com.projeto.assistant.dto.VendorResponseDTO;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.Vendor;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.VendorRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import com.projeto.assistant.repository.SectorRepository;
import com.projeto.assistant.model.Sector;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;
    private final SectorRepository sectorRepository;

    private Sector resolveSector(UUID sectorId) {
        if (sectorId == null) return null;
        return sectorRepository.findById(sectorId).orElse(null);
    }

    @Transactional
    public VendorResponseDTO create(VendorRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + request.workspaceId()));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        Vendor vendor = new Vendor();
        vendor.setWorkspace(workspace);
        vendor.setSector(resolveSector(request.sectorId()));
        vendor.setName(request.name());
        vendor.setServiceProvided(request.serviceProvided());
        vendor.setSharedDataCategories(request.sharedDataCategories());
        vendor.setDpaSigned(request.dpaSigned());
        vendor.setDpaSignedAt(request.dpaSignedAt());
        vendor.setSecurityClausesConfirmed(request.securityClausesConfirmed());
        vendor.setObservations(request.observations());
        vendor.setInvolvesInternationalTransfer(request.involvesInternationalTransfer());
        vendor.setDestinationCountry(request.destinationCountry());
        vendor.setTransferSafeguard(request.transferSafeguard());
        vendor.setTransferSafeguardDetails(request.transferSafeguardDetails());
        vendor.setCreatedBy(authUserId);

        Vendor saved = vendorRepository.save(vendor);

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.CREATE,
                AuditEntityType.VENDOR,
                saved.getId(),
                Map.of("name", saved.getName())
        );

        return VendorResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<VendorResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return vendorRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(VendorResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public VendorResponseDTO update(UUID id, VendorRequestDTO request, UUID authTenantId, UUID authUserId) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fornecedor não encontrado: " + id));

        if (!vendor.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este fornecedor");
        }

        vendor.setSector(resolveSector(request.sectorId()));
        vendor.setName(request.name());
        vendor.setServiceProvided(request.serviceProvided());
        vendor.setSharedDataCategories(request.sharedDataCategories());
        vendor.setDpaSigned(request.dpaSigned());
        vendor.setDpaSignedAt(request.dpaSignedAt());
        vendor.setSecurityClausesConfirmed(request.securityClausesConfirmed());
        vendor.setObservations(request.observations());
        vendor.setInvolvesInternationalTransfer(request.involvesInternationalTransfer());
        vendor.setDestinationCountry(request.destinationCountry());
        vendor.setTransferSafeguard(request.transferSafeguard());
        vendor.setTransferSafeguardDetails(request.transferSafeguardDetails());
        Vendor saved = vendorRepository.save(vendor);

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.UPDATE,
                AuditEntityType.VENDOR,
                saved.getId(),
                Map.of("name", saved.getName())
        );

        return VendorResponseDTO.fromEntity(saved);
    }

    @Transactional
    public void delete(UUID id, UUID authTenantId, UUID authUserId) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fornecedor não encontrado: " + id));

        if (!vendor.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este fornecedor");
        }

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.DELETE,
                AuditEntityType.VENDOR,
                vendor.getId(),
                Map.of("name", vendor.getName())
        );

        vendorRepository.delete(vendor);
    }
}