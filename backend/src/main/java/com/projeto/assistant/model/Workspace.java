package com.projeto.assistant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "workspaces")
@Getter
@Setter
@NoArgsConstructor
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkspaceType type;

    @Column(name = "document_id", nullable = false, length = 32)
    private String documentId;

    @Column(length = 100)
    private String country;

    @Column
    private String state;

    @Column
    private String city;

    @Column
    private String neighborhood;

    @Column(name = "postal_code")
    private String postalCode;

    @Column
    private String street;

    @Column(name = "address_number")
    private String addressNumber;

    @Column
    private String phone;

    @ElementCollection(targetClass = LegalRegime.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "workspace_legal_regimes", joinColumns = @JoinColumn(name = "workspace_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "legal_regime")
    private Set<LegalRegime> legalRegimes = new HashSet<>();

    // Lado "inverso" do ManyToMany - o dono do relacionamento é o User (veja User.java)
    @ManyToMany(mappedBy = "workspaces")
    private Set<User> users = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

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
}