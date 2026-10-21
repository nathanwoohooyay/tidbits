package com.tidbits.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tidbits.model.dto.OrderEventDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class OrderEventConsumerTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final OrderService orderService = mock(OrderService.class);
    private final OrderEventConsumer consumer = new OrderEventConsumer(objectMapper, orderService);

    @Test
    void consumeOrderEvent_callsFillOrderForOrderPlaced() throws Exception {
        String payload = objectMapper.writeValueAsString(new OrderEventDTO(
                "ORDER_PLACED", LocalDateTime.now(), 1, 42, null, 9, 1.0, 100.0, 100.0,
                "BUY", "PLACED", null, null
        ));

        consumer.consumeOrderEvent(payload);

        verify(orderService).fillOrder(org.mockito.ArgumentMatchers.any(OrderEventDTO.class));
    }

    @Test
    void consumeOrderEvent_ignoresAcceptedAndFilled() throws Exception {
        String accepted = objectMapper.writeValueAsString(new OrderEventDTO(
                "ORDER_ACCEPTED", LocalDateTime.now(), 1, 42, null, 9, 1.0, 100.0, 100.0,
                "BUY", "ACCEPTED", null, null
        ));
        String filled = objectMapper.writeValueAsString(new OrderEventDTO(
                "ORDER_FILLED", LocalDateTime.now(), 1, 42, null, 9, 1.0, 100.0, 100.0,
                "BUY", "FILLED", null, null
        ));

        consumer.consumeOrderEvent(accepted);
        consumer.consumeOrderEvent(filled);

        verify(orderService, never()).fillOrder(org.mockito.ArgumentMatchers.any(OrderEventDTO.class));
    }

    @Test
    void consumeOrderEvent_ignoresMalformedPayload() {
        consumer.consumeOrderEvent("not-json");

        verify(orderService, never()).fillOrder(org.mockito.ArgumentMatchers.any(OrderEventDTO.class));
    }

    @Test
    void consumeOrderEvent_ignoresNullEventType() throws Exception {
        String payload = objectMapper.writeValueAsString(new OrderEventDTO(
                null, LocalDateTime.now(), 1, 42, null, 9, 1.0, 100.0, 100.0,
                "BUY", "PLACED", null, null
        ));

        consumer.consumeOrderEvent(payload);

        verify(orderService, never()).fillOrder(org.mockito.ArgumentMatchers.any(OrderEventDTO.class));
    }
}
