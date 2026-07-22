package com.projeto.assistant.controller;

import com.projeto.assistant.dto.UserRequestDTO;
import com.projeto.assistant.dto.UserResponseDTO;
import com.projeto.assistant.service.UserService;
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
    public UserResponseDTO create(@Valid @RequestBody UserRequestDTO request) {
        return userService.create(request);
    }

    @GetMapping
    public List<UserResponseDTO> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponseDTO findById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @PostMapping("/{userId}/workspaces/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void addToWorkspace(@PathVariable UUID userId, @PathVariable UUID workspaceId) {
        userService.addUserToWorkspace(userId, workspaceId);
    }

    @GetMapping("/{userId}/workspaces")
    public List<WorkspaceMembershipResponseDTO> findWorkspaces(@PathVariable UUID userId) {
        return userService.findWorkspacesOfUser(userId);
    }
}