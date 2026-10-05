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
        publish(eventType, order, orderResponse, null);
    }

    public void publish(String eventType, Order order, OrderResponseDTO orderResponse, Integer transactionId) {
        OrderEventDTO event = new OrderEventDTO(
                eventType,
                LocalDateTime.now(),
                order.getOrderId(),
                order.getAccountId(),
                transactionId,
                order.getInstrumentId(),
                order.getQuantity(),
                order.getStockPrice(),
            resolveOrderAmount(order),
                order.getOrderType() == null ? null : order.getOrderType().name(),
                order.getStatus() == null ? null : order.getStatus().name(),
                orderResponse.getInstrument(),
                orderResponse.getStatusHistory()
        );

        send(event, String.valueOf(order.getAccountId()));
    }

    public void publishAccountTransactionEvent(String eventType, Integer accountId, Integer transactionId, Double amount) {
        OrderEventDTO event = new OrderEventDTO(
                eventType,
                LocalDateTime.now(),
                null,
                accountId,
                transactionId,
                null,
                null,
                null,
                amount,
                null,
                "SUCCESS",
                null,
                null
        );

        send(event, String.valueOf(accountId));
    }

    private void send(OrderEventDTO event, String key) {
        try {
            kafkaTemplate.send(orderTopic, key, objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize order event.", ex);
        }
    }

    private Double resolveOrderAmount(Order order) {
        if (order.getQuantity() == null || order.getStockPrice() == null) {
            return null;
        }

        return floorToTwoDecimals(order.getQuantity() * order.getStockPrice());
    }

    private double floorToTwoDecimals(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.FLOOR).doubleValue();
    }
}