package com.tidbits.audit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.audit.model.dto.OrderAuditEventDTO;
import com.tidbits.audit.model.dto.UserAuditEventDTO;
import com.tidbits.audit.model.entity.TransactionLog;
import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.model.enums.LogStatus;
import com.tidbits.audit.repository.AccountRefRepository;
import com.tidbits.audit.repository.AccountTransactionRefRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;

@Component
public class AuditEventConsumer {

    private static final Set<String> TRANSACTION_EVENTS = Set.of(
            "ORDER_PLACED",
            "ORDER_ACCEPTED",
            "ORDER_REJECTED",
            "ORDER_FILLED",
            "DEPOSIT",
            "WITHDRAW"
    );

    private final ObjectMapper objectMapper;
    private final TransactionLogService transactionLogService;
    private final UserLogService userLogService;
    private final AccountRefRepository accountRefRepository;
    private final AccountTransactionRefRepository accountTransactionRefRepository;

    public AuditEventConsumer(
            ObjectMapper objectMapper,
            TransactionLogService transactionLogService,
            UserLogService userLogService,
            AccountRefRepository accountRefRepository,
            AccountTransactionRefRepository accountTransactionRefRepository
    ) {
        this.objectMapper = objectMapper;
        this.transactionLogService = transactionLogService;
        this.userLogService = userLogService;
        this.accountRefRepository = accountRefRepository;
        this.accountTransactionRefRepository = accountTransactionRefRepository;
    }

    @KafkaListener(
            topics = "${app.kafka.order-topic}",
            groupId = "${app.kafka.audit-consumer-group:audit-service-consumer}"
    )
    public void consumeOrderEvent(String payload) {
        OrderAuditEventDTO event = tryReadOrderEvent(payload);
        if (event == null || event.eventType() == null || !TRANSACTION_EVENTS.contains(event.eventType())) {
            return;
        }

        if (event.accountId() == null) {
            return;
        }

        Integer userId = accountRefRepository.findById(event.accountId()).map(account -> account.getUserId()).orElse(null);
        if (userId == null) {
            return;
        }

        Integer transactionId = event.transactionId();
        if (transactionId == null && event.orderId() != null) {
            transactionId = accountTransactionRefRepository
                    .findFirstByOrderIdOrderByTransactionIdDesc(event.orderId())
                    .map(tx -> tx.getTransactionId())
                    .orElse(null);
        }

        TransactionLog log = new TransactionLog();
        log.setUserId(userId);
        log.setAccountId(event.accountId());
        log.setEvent(event.eventType());
        log.setAmount(resolveAmount(event));
        log.setIpAddress(null);
        log.setTransactionId(transactionId);
        log.setStatus(resolveTransactionStatus(event));
        log.setHappenedAt(event.occurredAt() == null ? LocalDateTime.now() : event.occurredAt());

        transactionLogService.createTransactionLog(log);
    }

    @KafkaListener(
            topics = "${app.kafka.user-audit-topic}",
            groupId = "${app.kafka.audit-consumer-group:audit-service-consumer}"
    )
    public void consumeUserEvent(String payload) {
        UserAuditEventDTO event = tryReadUserEvent(payload);
        if (event == null || event.eventType() == null) {
            return;
        }

        UserLog log = new UserLog();
        log.setUserId(event.userId());
        log.setIpAddress(event.ipAddress());
        log.setEvent(event.eventType());
        log.setStatus(LogStatus.fromValue(event.status()));
        log.setHappenedAt(event.occurredAt() == null ? LocalDateTime.now() : event.occurredAt());

        userLogService.createUserLog(log);
    }

    private OrderAuditEventDTO tryReadOrderEvent(String payload) {
        try {
            return objectMapper.readValue(payload, OrderAuditEventDTO.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private UserAuditEventDTO tryReadUserEvent(String payload) {
        try {
            return objectMapper.readValue(payload, UserAuditEventDTO.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private LogStatus resolveTransactionStatus(OrderAuditEventDTO event) {
        if ("ORDER_REJECTED".equals(event.eventType())) {
            return LogStatus.FAILURE;
        }

        LogStatus explicitStatus = LogStatus.fromValue(event.status());
        return explicitStatus == null ? LogStatus.SUCCESS : explicitStatus;
    }

    private Double resolveAmount(OrderAuditEventDTO event) {
        if (event.amount() != null) {
            return event.amount();
        }

        if (event.quantity() != null && event.stockPrice() != null) {
            return event.quantity() * event.stockPrice();
        }

        return null;
    }
}
