package com.projeto.assistant.service;

import com.projeto.assistant.dto.PlatformTenantSummaryDTO;
import com.projeto.assistant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlatformService {

    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public List<PlatformTenantSummaryDTO> listAllTenants() {
        return tenantRepository.findAllWithStats();
    }
}