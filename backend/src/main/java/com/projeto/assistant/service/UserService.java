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

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

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

    public List<UserResponseDTO> findAll() {
        return userRepository.findAll()
                .stream()
                .map(UserResponseDTO::fromEntity)
                .toList();
    }

    public UserResponseDTO findById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + id));
        return UserResponseDTO.fromEntity(user);
    }
}