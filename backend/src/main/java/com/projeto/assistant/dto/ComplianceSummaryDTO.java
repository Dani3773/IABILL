package com.projeto.assistant.dto;

public record ComplianceSummaryDTO(
        int ropaActivityCount,
        int vendorsTotal,
        int vendorsWithDpaSigned,
        int employeesActiveTotal,
        int employeesTrainedCount,
        int documentsOverdueCount,
        int incidentsOpenCount,
        int dsrPendingCount
) {
}