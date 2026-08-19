package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.MfaConfirmRequestDTO;
import com.projeto.assistant.dto.MfaSetupResponseDTO;
import com.projeto.assistant.dto.MfaStatusResponseDTO;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.service.MfaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mfa")
@RequiredArgsConstructor
public class MfaController {

    private final MfaService mfaService;
    private final UserRepository userRepository;

    @GetMapping("/status")
    public MfaStatusResponseDTO status(@RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        boolean enabled = userRepository.findById(authUserId)
                .map(u -> u.isMfaEnabled())
                .orElse(false);
        return new MfaStatusResponseDTO(enabled);
    }

    @PostMapping("/setup")
    public MfaSetupResponseDTO startSetup(@RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return mfaService.startSetup(authUserId);
    }

    @PostMapping("/confirm")
    public Map<String, Boolean> confirmSetup(
            @Valid @RequestBody MfaConfirmRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        boolean valid = mfaService.confirmSetup(authUserId, request.code());
        return Map.of("success", valid);
    }

    @DeleteMapping
    public void disable(@RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        mfaService.disable(authUserId);
    }
}