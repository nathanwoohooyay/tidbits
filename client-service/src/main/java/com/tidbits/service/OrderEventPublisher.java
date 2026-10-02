package com.tidbits.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.model.dto.OrderEventDTO;
import com.tidbits.model.dto.OrderResponseDTO;
import com.tidbits.model.entity.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class OrderEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String orderTopic;

    public OrderEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.kafka.order-topic}") String orderTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.orderTopic = orderTopic;
    }

    public void publish(String eventType, Order order, OrderResponseDTO orderResponse) {
        OrderEventDTO event = new OrderEventDTO(
                eventType,
                LocalDateTime.now(),
                order.getOrderId(),
                order.getAccountId(),
                order.getInstrumentId(),
                order.getQuantity(),
                order.getStockPrice(),
                order.getOrderType() == null ? null : order.getOrderType().name(),
                order.getStatus() == null ? null : order.getStatus().name(),
                orderResponse.getInstrument(),
                orderResponse.getStatusHistory()
        );

        try {
            kafkaTemplate.send(orderTopic, String.valueOf(order.getOrderId()), objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize order event.", ex);
        }
    }
}