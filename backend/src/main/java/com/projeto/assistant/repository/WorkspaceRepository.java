package com.projeto.assistant.repository;

import com.projeto.assistant.model.Workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
    List<Workspace> findByTenantId(UUID tenantId);
    Optional<Workspace> findByDocumentId(String documentId);

    // Busca por CNPJ comparando so os digitos - o campo documentId e armazenado
    // formatado (com pontos e barra), mas o CNPJ formatado NUNCA deve ser usado em
    // URLs publicas (a barra quebra o roteamento client-side, fazendo o CloudFront/S3
    // interpretar como dois niveis de caminho em vez de um parametro so). Toda URL
    // publica que identifica workspace por CNPJ deve usar so os digitos.
    @Query(value = "SELECT * FROM workspaces WHERE regexp_replace(document_id, '[^0-9]', '', 'g') = :digitsOnly", nativeQuery = true)
    Optional<Workspace> findByDocumentIdDigitsOnly(@Param("digitsOnly") String digitsOnly);
}