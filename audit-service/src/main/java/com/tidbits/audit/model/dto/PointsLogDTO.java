package com.tidbits.audit.model.dto;

import com.tidbits.audit.model.enums.LogStatus;
import java.time.LocalDateTime;

public record PointsLogDTO(
        Integer logId,
        Integer userId,
        String username,
        Integer accountId,
        Integer pointsTransactionId,
        String event,
        Integer pointsDelta,
        Integer balanceAfter,
        Double cashValue,
        Integer instrumentId,
        String ticker,
        Double quantity,
        Integer referenceId,
        String details,
        LogStatus status,
        LocalDateTime happenedAt
) {
}
