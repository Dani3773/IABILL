package com.projeto.assistant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "data_incidents")
@Getter
@Setter
@NoArgsConstructor
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "affected_data_categories", nullable = false, columnDefinition = "TEXT")
    private String affectedDataCategories;

    @Column(name = "estimated_affected_count")
    private Integer estimatedAffectedCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IncidentStatus status;

    @Column(name = "discovered_at", nullable = false)
    private Instant discoveredAt;

    @Column(name = "occurred_at")
    private Instant occurredAt;

    @Column(name = "anpd_notified_at")
    private Instant anpdNotifiedAt;

    @Column(name = "data_subjects_notified_at")
    private Instant dataSubjectsNotifiedAt;

    @Column(name = "mitigation_measures", columnDefinition = "TEXT")
    private String mitigationMeasures;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = IncidentStatus.IDENTIFIED;
        if (this.discoveredAt == null) this.discoveredAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}