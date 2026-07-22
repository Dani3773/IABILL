package com.projeto.assistant.service;

import com.projeto.assistant.dto.UserRequestDTO;
import com.projeto.assistant.dto.UserResponseDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.projeto.assistant.dto.WorkspaceMembershipResponseDTO;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.WorkspaceRepository;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    private final WorkspaceRepository workspaceRepository;

    public UserResponseDTO create(UserRequestDTO request) {
        Tenant tenant = tenantRepository.findById(request.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + request.tenantId()));

        User user = new User();
        user.setTenant(tenant);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password())); // nunca salvamos a senha em texto puro
        user.setRole(request.role());

        User saved = userRepository.save(user);
        return UserResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> findByTenant(UUID tenantId) {
        return userRepository.findByTenantId(tenantId)
                .stream()
                .map(UserResponseDTO::fromEntity)
                .toList();
    }

    public UserResponseDTO findById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + id));
        return UserResponseDTO.fromEntity(user);
    }

    @Transactional
    public void addUserToWorkspace(UUID userId, UUID workspaceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        user.getWorkspaces().add(workspace);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMembershipResponseDTO> findWorkspacesOfUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        return user.getWorkspaces()
                .stream()
                .map(WorkspaceMembershipResponseDTO::fromEntity)
                .toList();
    }
}