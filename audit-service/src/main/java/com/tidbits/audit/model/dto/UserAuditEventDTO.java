package com.tidbits.audit.model.dto;

import java.time.LocalDateTime;

public record UserAuditEventDTO(
        String eventType,
        LocalDateTime occurredAt,
        Integer userId,
        String username,
        String ipAddress,
        String status,
        String details,
        // The browser's User-Agent header; null for events published before it was recorded.
        String userAgent
) {
}
