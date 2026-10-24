package com.tidbits.audit.model.dto;

import java.time.LocalDateTime;

public record PointsAuditEventDTO(
        String eventType,
        LocalDateTime occurredAt,
        Integer userId,
        Integer accountId,
        Integer pointsTransactionId,
        Integer pointsDelta,
        Integer balanceAfter,
        Double cashValue,
        Integer instrumentId,
        Double quantity,
        Integer referenceId,
        String status,
        String details
) {
}
