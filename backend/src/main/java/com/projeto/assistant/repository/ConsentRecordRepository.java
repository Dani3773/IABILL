package com.projeto.assistant.repository;

import com.projeto.assistant.model.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, UUID> {
    List<ConsentRecord> findByProcessingActivityIdOrderByConsentedAtDesc(UUID processingActivityId);
}