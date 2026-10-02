package com.tidbits.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public record OrderEventDTO(
        String eventType,
        LocalDateTime occurredAt,
        Integer orderId,
        Integer accountId,
        Integer instrumentId,
        Double quantity,
        Double stockPrice,
        String orderType,
        String status,
        InstrumentDTO instrument,
        List<OrderStatusHistoryDTO> statusHistory
) {
}