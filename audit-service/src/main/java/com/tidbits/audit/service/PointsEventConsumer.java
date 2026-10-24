package com.tidbits.audit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.audit.model.dto.PointsAuditEventDTO;
import com.tidbits.audit.model.entity.PointsLog;
import com.tidbits.audit.model.enums.LogStatus;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PointsEventConsumer {

    private final ObjectMapper objectMapper;
    private final PointsLogService pointsLogService;

    public PointsEventConsumer(ObjectMapper objectMapper, PointsLogService pointsLogService) {
        this.objectMapper = objectMapper;
        this.pointsLogService = pointsLogService;
    }

    @KafkaListener(
            topics = "${app.kafka.points-topic}",
            groupId = "${app.kafka.audit-consumer-group:audit-service-consumer}"
    )
    public void consumePointsEvent(String payload) {
        PointsAuditEventDTO event = tryRead(payload);
        if (event == null || event.eventType() == null || event.userId() == null) {
            return;
        }

        PointsLog log = new PointsLog();
        log.setUserId(event.userId());
        log.setAccountId(event.accountId());
        log.setPointsTransactionId(event.pointsTransactionId());
        log.setEvent(event.eventType());
        log.setPointsDelta(event.pointsDelta());
        log.setBalanceAfter(event.balanceAfter());
        log.setCashValue(event.cashValue());
        log.setInstrumentId(event.instrumentId());
        log.setQuantity(event.quantity());
        log.setReferenceId(event.referenceId());
        log.setDetails(event.details());
        LogStatus status = LogStatus.fromValue(event.status());
        log.setStatus(status == null ? LogStatus.SUCCESS : status);
        log.setHappenedAt(event.occurredAt() == null ? LocalDateTime.now() : event.occurredAt());

        pointsLogService.createPointsLog(log);
    }

    private PointsAuditEventDTO tryRead(String payload) {
        try {
            return objectMapper.readValue(payload, PointsAuditEventDTO.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }
}
