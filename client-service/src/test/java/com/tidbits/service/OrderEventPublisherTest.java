package com.tidbits.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.model.dto.OrderResponseDTO;
import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderEventPublisherTest {

    private static OrderResponseDTO emptyResponse() {
        return new OrderResponseDTO(null, null, null, null, null, null, null);
    }

    @Test
    void publish_sendsSerializedEvent() throws Exception {
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        ObjectMapper objectMapper = mock(ObjectMapper.class);
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        OrderEventPublisher publisher = new OrderEventPublisher(kafkaTemplate, objectMapper, "order-topic");
        Order order = new Order(7, 42, 9, 3.0, 10.129, OrderType.BUY, OrderStatus.PLACED);

        publisher.publish("ORDER_PLACED", order, emptyResponse());

        verify(kafkaTemplate).send(eq("order-topic"), eq("42"), eq("{}"));
    }

    @Test
    void publishAccountTransactionEvent_sendsSerializedEvent() throws Exception {
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        ObjectMapper objectMapper = mock(ObjectMapper.class);
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        OrderEventPublisher publisher = new OrderEventPublisher(kafkaTemplate, objectMapper, "order-topic");

        publisher.publishAccountTransactionEvent("DEPOSIT", 42, 1001, 12.34);

        verify(kafkaTemplate).send(eq("order-topic"), eq("42"), eq("{}"));
    }

    @Test
    void publish_throwsIllegalStateWhenSerializationFails() throws Exception {
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        ObjectMapper objectMapper = mock(ObjectMapper.class);
        when(objectMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("boom") {});

        OrderEventPublisher publisher = new OrderEventPublisher(kafkaTemplate, objectMapper, "order-topic");
        Order order = new Order(7, 42, 9, 3.0, 10.0, OrderType.BUY, OrderStatus.PLACED);

        assertThrows(IllegalStateException.class, () ->
            publisher.publish("ORDER_PLACED", order, emptyResponse())
        );
    }
}
