package com.projeto.assistant.controller;

import com.projeto.assistant.dto.TenantRequestDTO;
import com.projeto.assistant.dto.TenantResponseDTO;
import com.projeto.assistant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TenantResponseDTO create(@Valid @RequestBody TenantRequestDTO request) {
        return tenantService.create(request);
    }

    @GetMapping
    public List<TenantResponseDTO> findAll() {
        return tenantService.findAll();
    }

    @GetMapping("/{id}")
    public TenantResponseDTO findById(@PathVariable UUID id) {
        return tenantService.findById(id);
    }
}