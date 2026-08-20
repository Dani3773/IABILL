package com.projeto.assistant.service;

import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.ConsentRecord;
import com.projeto.assistant.model.ProcessingActivity;
import com.projeto.assistant.repository.ConsentRecordRepository;
import com.projeto.assistant.repository.ProcessingActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsentService {

    private final ProcessingActivityRepository processingActivityRepository;
    private final ConsentRecordRepository consentRecordRepository;

    @Transactional(readOnly = true)
    public PublicConsentInfoDTO getPublicInfo(UUID activityId) {
        return processingActivityRepository.findById(activityId)
                .map(a -> new PublicConsentInfoDTO(true, a.getWorkspace().getName(), a.getProcessName(), a.getPurpose()))
                .orElse(new PublicConsentInfoDTO(false, null, null, null));
    }

    // Endpoint publico - sem authTenantId, o titular nunca tem conta no sistema.
    @Transactional
    public ConsentRecordResponseDTO submit(UUID activityId, ConsentSubmissionDTO request, HttpServletRequest httpRequest) {
        ProcessingActivity activity = processingActivityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Atividade não encontrada: " + activityId));

        ConsentRecord record = new ConsentRecord();
        record.setProcessingActivity(activity);
        record.setConsenterName(request.consenterName());
        record.setConsenterEmail(request.consenterEmail());
        // Snapshot do texto no momento exato do consentimento - se a finalidade
        // for editada depois, o registro antigo continua provando o que foi
        // realmente aceito naquele momento, nao o texto atual.
        record.setConsentTextSnapshot(activity.getPurpose());
        record.setIpAddress(extractClientIp(httpRequest));

        ConsentRecord saved = consentRecordRepository.save(record);
        return ConsentRecordResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ConsentRecordResponseDTO> findByActivity(UUID activityId, UUID authTenantId) {
        ProcessingActivity activity = processingActivityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Atividade não encontrada: " + activityId));

        if (!activity.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a esta atividade");
        }

        return consentRecordRepository.findByProcessingActivityIdOrderByConsentedAtDesc(activityId)
                .stream()
                .map(ConsentRecordResponseDTO::fromEntity)
                .toList();
    }

    // O app roda atras do CloudFront/Elastic Beanstalk - request.getRemoteAddr()
    // devolveria o IP do load balancer, nao do usuario real. X-Forwarded-For
    // carrega a cadeia real de IPs, o primeiro da lista e o do cliente original.
    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}