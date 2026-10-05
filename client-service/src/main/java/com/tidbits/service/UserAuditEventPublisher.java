package com.tidbits.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.model.dto.UserAuditEventDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserAuditEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String userAuditTopic;

    public UserAuditEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.kafka.user-audit-topic}") String userAuditTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.userAuditTopic = userAuditTopic;
    }

    public void publish(String eventType, Integer userId, String status, String details) {
        UserAuditEventDTO event = new UserAuditEventDTO(
                eventType,
                LocalDateTime.now(),
                userId,
                null,
                status,
                details
        );

        try {
            kafkaTemplate.send(userAuditTopic, userId == null ? "unknown" : String.valueOf(userId), objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize user audit event.", ex);
        }
    }
}
