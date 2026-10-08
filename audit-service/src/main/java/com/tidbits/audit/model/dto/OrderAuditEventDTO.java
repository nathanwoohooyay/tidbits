package com.tidbits.audit.model.dto;

import java.time.LocalDateTime;

public record OrderAuditEventDTO(
        String eventType,
        LocalDateTime occurredAt,
        Integer orderId,
        Integer accountId,
        Integer transactionId,
        Integer instrumentId,
        Double quantity,
        Double stockPrice,
        Double amount,
        String orderType,
        String status
) {
}
