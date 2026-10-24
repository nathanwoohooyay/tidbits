package com.tidbits.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tidbits.audit.model.entity.PointsLog;
import com.tidbits.audit.model.enums.LogStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PointsEventConsumerTest {

    @Mock
    private PointsLogService pointsLogService;

    private PointsEventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new PointsEventConsumer(new ObjectMapper().registerModule(new JavaTimeModule()), pointsLogService);
    }

    @Test
    void consumePointsEvent_persistsLedgerFields() {
        consumer.consumePointsEvent("""
                {"eventType":"STOCK_DROP","occurredAt":"2026-10-22T10:15:00","userId":4,"accountId":9,
                 "pointsTransactionId":31,"pointsDelta":-5000,"balanceAfter":1200,"cashValue":5.0,
                 "instrumentId":2,"quantity":0.025,"referenceId":null,"status":"SUCCESS",
                 "details":"0.0250 AAPL @ $200.00 into Main"}
                """);

        ArgumentCaptor<PointsLog> log = ArgumentCaptor.forClass(PointsLog.class);
        verify(pointsLogService).createPointsLog(log.capture());
        assertEquals("STOCK_DROP", log.getValue().getEvent());
        assertEquals(-5000, log.getValue().getPointsDelta());
        assertEquals(1200, log.getValue().getBalanceAfter());
        assertEquals(31, log.getValue().getPointsTransactionId());
        assertEquals(LogStatus.SUCCESS, log.getValue().getStatus());
        assertEquals(LocalDateTime.of(2026, 10, 22, 10, 15), log.getValue().getHappenedAt());
    }

    @Test
    void consumePointsEvent_recordsFailures() {
        consumer.consumePointsEvent("""
                {"eventType":"SCRATCH_CARD","userId":4,"pointsDelta":-250,"balanceAfter":100,"status":"FAILURE",
                 "details":"Insufficient points: Scratch card"}
                """);

        ArgumentCaptor<PointsLog> log = ArgumentCaptor.forClass(PointsLog.class);
        verify(pointsLogService).createPointsLog(log.capture());
        assertEquals(LogStatus.FAILURE, log.getValue().getStatus());
    }

    @Test
    void consumePointsEvent_persistsStockPackAward() {
        consumer.consumePointsEvent("""
                {"eventType":"STOCK_PACK","occurredAt":"2026-10-23T10:15:00","userId":4,"accountId":9,
                 "pointsTransactionId":32,"pointsDelta":-10000,"balanceAfter":1200,"cashValue":8.0,
                 "instrumentId":2,"quantity":0.04,"status":"SUCCESS",
                 "details":"SILVER stock pack: 0.0400 AAPL @ $200.0000; awarded value $8.0000"}
                """);

        ArgumentCaptor<PointsLog> log = ArgumentCaptor.forClass(PointsLog.class);
        verify(pointsLogService).createPointsLog(log.capture());
        assertEquals("STOCK_PACK", log.getValue().getEvent());
        assertEquals(-10000, log.getValue().getPointsDelta());
        assertEquals(8.0, log.getValue().getCashValue());
        assertEquals(0.04, log.getValue().getQuantity());
        assertEquals(2, log.getValue().getInstrumentId());
        assertEquals(9, log.getValue().getAccountId());
        assertEquals(LogStatus.SUCCESS, log.getValue().getStatus());
    }

    @Test
    void consumePointsEvent_ignoresMalformedPayloads() {
        consumer.consumePointsEvent("not json");
        consumer.consumePointsEvent("{\"eventType\":\"CASH_OUT\"}");

        verify(pointsLogService, never()).createPointsLog(any());
    }
}
