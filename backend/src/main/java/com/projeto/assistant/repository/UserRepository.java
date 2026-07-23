package com.projeto.assistant.repository;

import com.projeto.assistant.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface UserRepository extends JpaRepository<User, UUID> {

    // Necessário para o futuro login: buscar usuário por e-mail DENTRO de um tenant específico
    Optional<User> findByTenantIdAndEmail(UUID tenantId, String email);

    List<User> findByTenantId(UUID tenantId);
    List<User> findByEmail(String email);
}