package com.tidbits.model.dto;

import java.time.LocalDateTime;

public record PointsTransactionDTO(
        Integer pointsTransactionId,
        String eventType,
        Integer pointsDelta,
        Integer balanceAfter,
        Integer accountId,
        Double cashValue,
        Integer instrumentId,
        String ticker,
        Double quantity,
        Integer referenceId,
        String details,
        LocalDateTime createdAt
) {
}
