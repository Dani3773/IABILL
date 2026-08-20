package com.projeto.assistant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id")
    private Sector sector;

    @Column(name = "service_provided", nullable = false, columnDefinition = "TEXT")
    private String serviceProvided;

    @Column(name = "shared_data_categories", nullable = false, columnDefinition = "TEXT")
    private String sharedDataCategories;

    @Column(name = "dpa_signed", nullable = false)
    private boolean dpaSigned = false;

    @Column(name = "dpa_signed_at")
    private LocalDate dpaSignedAt;

    @Column(name = "security_clauses_confirmed", nullable = false)
    private boolean securityClausesConfirmed = false;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}