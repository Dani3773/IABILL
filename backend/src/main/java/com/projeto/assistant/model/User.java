package com.projeto.assistant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ManyToOne: muitos usuários pertencem a UM tenant.
    // FetchType.LAZY é obrigatório aqui - nunca carregamos o Tenant inteiro
    // só porque carregamos um User, a menos que explicitamente precisemos.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = true)
    private Tenant tenant;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "committee_role")
    private String committeeRole;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = true;

    @Column(name = "email_verification_token")
    private String emailVerificationToken;

    @Column(name = "email_verification_expires_at")
    private Instant emailVerificationExpiresAt;

    @Column(name = "password_reset_token")
    private String passwordResetToken;

    @Column(name = "password_reset_expires_at")
    private Instant passwordResetExpiresAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    @ManyToMany
    @JoinTable(
            name = "user_workspaces",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "workspace_id")
    )
    private Set<Workspace> workspaces = new HashSet<>();

}