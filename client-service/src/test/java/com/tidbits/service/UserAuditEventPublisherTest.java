package com.tidbits.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserAuditEventPublisherTest {

    @Test
    void publish_sendsSerializedEventWithUserKey() throws Exception {
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        ObjectMapper objectMapper = mock(ObjectMapper.class);
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        UserAuditEventPublisher publisher = new UserAuditEventPublisher(kafkaTemplate, objectMapper, "user-topic");

        publisher.publish("LOGIN", 42, "SUCCESS", "ok");

        verify(kafkaTemplate).send(eq("user-topic"), eq("42"), eq("{}"));
    }

    @Test
    void publish_usesUnknownKeyWhenUserIdNull() throws Exception {
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        ObjectMapper objectMapper = mock(ObjectMapper.class);
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        UserAuditEventPublisher publisher = new UserAuditEventPublisher(kafkaTemplate, objectMapper, "user-topic");

        publisher.publish("LOGIN", null, "SUCCESS", "ok");

        verify(kafkaTemplate).send(eq("user-topic"), eq("unknown"), eq("{}"));
    }

    @Test
    void publish_throwsIllegalStateWhenSerializationFails() throws Exception {
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        ObjectMapper objectMapper = mock(ObjectMapper.class);
        when(objectMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("boom") {});

        UserAuditEventPublisher publisher = new UserAuditEventPublisher(kafkaTemplate, objectMapper, "user-topic");

        assertThrows(IllegalStateException.class, () -> publisher.publish("LOGIN", 42, "SUCCESS", "ok"));
    }
}
