package com.projeto.assistant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "processing_activities")
@Getter
@Setter
@NoArgsConstructor
public class ProcessingActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(name = "process_name", nullable = false)
    private String processName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id")
    private Sector sector;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "legal_basis", nullable = false)
    private LegalBasis legalBasis;

    @Column(name = "data_subject_categories", nullable = false, columnDefinition = "TEXT")
    private String dataSubjectCategories;

    @Column(name = "personal_data_categories", nullable = false, columnDefinition = "TEXT")
    private String personalDataCategories;

    @Column(name = "data_sharing", columnDefinition = "TEXT")
    private String dataSharing;

    @Column(name = "security_measures", columnDefinition = "TEXT")
    private String securityMeasures;

    @Column(name = "retention_period")
    private String retentionPeriod;

    @Column(name = "retention_expires_at")
    private java.time.LocalDate retentionExpiresAt;

    @Column(name = "involves_sensitive_data", nullable = false)
    private boolean involvesSensitiveData = false;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "ripd_suggestion_dismissed", nullable = false)
    private boolean ripdSuggestionDismissed = false;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "applicable_regime", nullable = false)
    private LegalRegime applicableRegime;
}