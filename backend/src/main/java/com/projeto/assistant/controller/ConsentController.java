package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.*;
import com.projeto.assistant.service.ConsentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/consent")
@RequiredArgsConstructor
public class ConsentController {

    private final ConsentService consentService;

    @GetMapping("/public/{activityId}")
    public PublicConsentInfoDTO publicInfo(@PathVariable UUID activityId) {
        return consentService.getPublicInfo(activityId);
    }

    @PostMapping("/public/{activityId}")
    public ConsentRecordResponseDTO submit(
            @PathVariable UUID activityId,
            @Valid @RequestBody ConsentSubmissionDTO request,
            HttpServletRequest httpRequest) {
        return consentService.submit(activityId, request, httpRequest);
    }

    @GetMapping("/activity/{activityId}")
    public List<ConsentRecordResponseDTO> findByActivity(
            @PathVariable UUID activityId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return consentService.findByActivity(activityId, authTenantId);
    }
}