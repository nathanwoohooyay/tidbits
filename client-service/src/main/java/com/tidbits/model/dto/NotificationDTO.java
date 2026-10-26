package com.tidbits.model.dto;

import java.time.LocalDateTime;

public record NotificationDTO(
        Integer notificationId,
        String category,
        String title,
        String message,
        Integer accountId,
        Integer orderId,
        Integer transactionId,
        String ticker,
        LocalDateTime createdAt,
        boolean read
) {
}
