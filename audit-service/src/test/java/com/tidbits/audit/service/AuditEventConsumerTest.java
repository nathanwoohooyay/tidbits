package com.tidbits.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tidbits.audit.model.dto.OrderAuditEventDTO;
import com.tidbits.audit.model.dto.UserAuditEventDTO;
import com.tidbits.audit.model.entity.AccountRef;
import com.tidbits.audit.model.entity.AccountTransactionRef;
import com.tidbits.audit.model.entity.TransactionLog;
import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.model.enums.LogStatus;
import com.tidbits.audit.repository.AccountRefRepository;
import com.tidbits.audit.repository.AccountTransactionRefRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditEventConsumerTest {

    @Mock
    private TransactionLogService transactionLogService;

    @Mock
    private UserLogService userLogService;

    @Mock
    private AccountRefRepository accountRefRepository;

    @Mock
    private AccountTransactionRefRepository accountTransactionRefRepository;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        private AuditEventConsumer auditEventConsumer;

        @BeforeEach
        void setUp() {
        auditEventConsumer = new AuditEventConsumer(
            objectMapper,
            transactionLogService,
            userLogService,
            accountRefRepository,
            accountTransactionRefRepository
        );
        }

    @Test
    void consumeOrderEvent_createsTransactionLogForValidEvent() throws Exception {
        LocalDateTime occurredAt = LocalDateTime.of(2026, 1, 10, 9, 30);
        OrderAuditEventDTO event = new OrderAuditEventDTO(
                "ORDER_PLACED", occurredAt, 333, 12, null, 7, 2.0, 5.0, null, "BUY", "SUCCESS"
        );

        AccountRef accountRef = new AccountRef();
        accountRef.setAccountId(12);
        accountRef.setUserId(44);

        AccountTransactionRef txRef = new AccountTransactionRef();
        txRef.setTransactionId(909);
        txRef.setOrderId(333);

        when(accountRefRepository.findById(12)).thenReturn(Optional.of(accountRef));
        when(accountTransactionRefRepository.findFirstByOrderIdOrderByTransactionIdDesc(333)).thenReturn(Optional.of(txRef));

        auditEventConsumer.consumeOrderEvent(objectMapper.writeValueAsString(event));

        ArgumentCaptor<TransactionLog> captor = ArgumentCaptor.forClass(TransactionLog.class);
        verify(transactionLogService).createTransactionLog(captor.capture());
        TransactionLog log = captor.getValue();
        assertEquals(44, log.getUserId());
        assertEquals(12, log.getAccountId());
        assertEquals("ORDER_PLACED", log.getEvent());
        assertEquals(10.0, log.getAmount());
        assertEquals(909, log.getTransactionId());
        assertEquals(LogStatus.SUCCESS, log.getStatus());
        assertEquals(occurredAt, log.getHappenedAt());
    }

    @Test
    void consumeOrderEvent_ignoresUnsupportedEvent() throws Exception {
        OrderAuditEventDTO event = new OrderAuditEventDTO(
                "ORDER_CANCELLED", LocalDateTime.now(), 333, 12, 1, 7, 2.0, 5.0, null, "BUY", "SUCCESS"
        );

        auditEventConsumer.consumeOrderEvent(objectMapper.writeValueAsString(event));

        verify(transactionLogService, never()).createTransactionLog(any(TransactionLog.class));
    }

    @Test
    void consumeOrderEvent_ignoresEventWhenAccountMissing() throws Exception {
        OrderAuditEventDTO event = new OrderAuditEventDTO(
                "ORDER_FILLED", LocalDateTime.now(), 333, 12, 1, 7, 2.0, 5.0, null, "BUY", "SUCCESS"
        );
        when(accountRefRepository.findById(12)).thenReturn(Optional.empty());

        auditEventConsumer.consumeOrderEvent(objectMapper.writeValueAsString(event));

        verify(transactionLogService, never()).createTransactionLog(any(TransactionLog.class));
    }

    @Test
    void consumeUserEvent_createsUserLogAndUsesNowWhenOccurredAtMissing() throws Exception {
        UserAuditEventDTO event = new UserAuditEventDTO("LOGIN", null, 50, "10.0.0.1", "SUCCESS", "ok");

        auditEventConsumer.consumeUserEvent(objectMapper.writeValueAsString(event));

        ArgumentCaptor<UserLog> captor = ArgumentCaptor.forClass(UserLog.class);
        verify(userLogService).createUserLog(captor.capture());

        UserLog log = captor.getValue();
        assertEquals(50, log.getUserId());
        assertEquals("10.0.0.1", log.getIpAddress());
        assertEquals("LOGIN", log.getEvent());
        assertEquals(LogStatus.SUCCESS, log.getStatus());
        assertNotNull(log.getHappenedAt());
    }

    @Test
    void consumeUserEvent_ignoresInvalidPayload() {
        auditEventConsumer.consumeUserEvent("not-json");

        verify(userLogService, never()).createUserLog(any(UserLog.class));
    }
}
