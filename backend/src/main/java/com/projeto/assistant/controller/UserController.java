package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestAttribute;
import com.projeto.assistant.dto.UserRequestDTO;
import com.projeto.assistant.dto.UserResponseDTO;
import com.projeto.assistant.service.UserService;
import com.projeto.assistant.config.JwtAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestAttribute;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.projeto.assistant.dto.WorkspaceMembershipResponseDTO;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponseDTO create(
            @Valid @RequestBody UserRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return userService.create(request, authUserId);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponseDTO> findAll(@RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return userService.findByTenant(authTenantId);
    }

    @GetMapping("/{id}")
    public UserResponseDTO findById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @PostMapping("/{userId}/workspaces/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void addToWorkspace(
            @PathVariable UUID userId,
            @PathVariable UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        userService.addUserToWorkspace(userId, workspaceId, authUserId);
    }

    @GetMapping("/{userId}/workspaces")
    public List<WorkspaceMembershipResponseDTO> findWorkspaces(@PathVariable UUID userId) {
        return userService.findWorkspacesOfUser(userId);
    }

    @PostMapping("/activate")
    public com.projeto.assistant.dto.EmailConfirmationResponseDTO activate(
            @Valid @RequestBody com.projeto.assistant.dto.UserActivationRequestDTO request) {
        return userService.activateAccount(request);
    }

    @PutMapping("/{userId}/dpo-substitute")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponseDTO toggleDpoSubstitute(
            @PathVariable UUID userId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return userService.toggleDpoSubstitute(userId, authTenantId, authUserId);
    }
}