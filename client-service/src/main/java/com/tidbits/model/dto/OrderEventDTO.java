package com.tidbits.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public record OrderEventDTO(
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
        String status,
        InstrumentDTO instrument,
        List<OrderStatusHistoryDTO> statusHistory
) {
}