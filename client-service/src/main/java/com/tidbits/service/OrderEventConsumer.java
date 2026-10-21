package com.tidbits.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.model.dto.OrderEventDTO;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventConsumer {

    private final ObjectMapper objectMapper;
    private final OrderService orderService;

    public OrderEventConsumer(ObjectMapper objectMapper, OrderService orderService) {
        this.objectMapper = objectMapper;
        this.orderService = orderService;
    }

    @KafkaListener(
            topics = "${app.kafka.order-topic}",
            groupId = "${app.kafka.order-consumer-group:client-service-order-create}"
    )
    public void consumeOrderEvent(String payload) {
        OrderEventDTO orderEvent = tryReadOrderEvent(payload);
        if (orderEvent == null || orderEvent.eventType() == null) {
            return;
        }

        System.out.println("READING order event: " + orderEvent.eventType());

        switch (orderEvent.eventType()) {
            case "ORDER_PLACED":
                orderService.fillOrder(orderEvent);
                break;
            case "ORDER_ACCEPTED":
            case "ORDER_FILLED":
                break;
            default:
                break;
        }
    }

    private OrderEventDTO tryReadOrderEvent(String payload) {
        try {
            return objectMapper.readValue(payload, OrderEventDTO.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }
}