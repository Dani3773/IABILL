package com.projeto.assistant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "consent_records")
@Getter
@Setter
@NoArgsConstructor
public class ConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processing_activity_id", nullable = false)
    private ProcessingActivity processingActivity;

    @Column(name = "consenter_name", nullable = false)
    private String consenterName;

    @Column(name = "consenter_email", nullable = false)
    private String consenterEmail;

    @Column(name = "consent_text_snapshot", nullable = false, columnDefinition = "TEXT")
    private String consentTextSnapshot;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "consented_at", nullable = false)
    private Instant consentedAt;

    @PrePersist
    protected void onCreate() {
        consentedAt = Instant.now();
    }
}