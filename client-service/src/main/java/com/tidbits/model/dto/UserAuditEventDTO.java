package com.tidbits.model.dto;

import java.time.LocalDateTime;

public record UserAuditEventDTO(
        String eventType,
        LocalDateTime occurredAt,
        Integer userId,
        String ipAddress,
        String status,
        String details
) {
}
