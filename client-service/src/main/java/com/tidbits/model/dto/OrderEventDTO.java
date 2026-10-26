package com.tidbits.model.dto;

import java.math.BigDecimal;

import java.time.LocalDateTime;
import java.util.List;

public record OrderEventDTO(
        String eventType,
        LocalDateTime occurredAt,
        Integer orderId,
        Integer accountId,
        Integer transactionId,
        Integer instrumentId,
        BigDecimal quantity,
        BigDecimal stockPrice,
        BigDecimal amount,
        String orderType,
        String status,
        InstrumentDTO instrument,
        List<OrderStatusHistoryDTO> statusHistory
) {
}