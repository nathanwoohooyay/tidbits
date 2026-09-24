package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.TransactionLog;
import com.tidbits.audit.model.enums.LogStatus;
import com.tidbits.audit.repository.TransactionLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Disabled("Enable after TransactionLogService methods are implemented")
@DisplayName("TransactionLogService Tests")
class TransactionLogServiceTest {

    @Mock
    private TransactionLogRepository transactionLogRepository;

    @InjectMocks
    private TransactionLogService transactionLogService;

    private TransactionLog testTransactionLog;

    @BeforeEach
    void setUp() {
        testTransactionLog = new TransactionLog(
            1,
            100,
            200,
            "TRANSFER_INITIATED",
            "192.168.1.1",
            500,
            LogStatus.SUCCESS,
            LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("Should persist and return a transaction log")
    void testCreateTransactionLog() {
        when(transactionLogRepository.save(testTransactionLog)).thenReturn(testTransactionLog);

        TransactionLog result = transactionLogService.createTransactionLog(testTransactionLog);

        assertEquals(testTransactionLog, result);
        verify(transactionLogRepository).save(testTransactionLog);
    }

    @Test
    @DisplayName("Should return empty optional when retrieving transaction log by ID")
    void testGetTransactionLogById() {
        Optional<TransactionLog> result = transactionLogService.getTransactionLogById(1);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should return empty optional when transaction log not found")
    void testGetTransactionLogByIdNotFound() {
        when(transactionLogRepository.findById(999)).thenReturn(Optional.empty());

        Optional<TransactionLog> result = transactionLogService.getTransactionLogById(999);

        assertTrue(result.isEmpty());
        verify(transactionLogRepository).findById(999);
    }

    @Test
    @DisplayName("Should return transaction logs for a user")
    void testGetLogsByUserId() {
        when(transactionLogRepository.findByUserId(100)).thenReturn(List.of(testTransactionLog));

        List<TransactionLog> result = transactionLogService.getLogsByUserId(100);

        assertEquals(List.of(testTransactionLog), result);
        verify(transactionLogRepository).findByUserId(100);
    }

    @Test
    @DisplayName("Should return empty list when no logs are found for a user")
    void testGetLogsByUserIdEmpty() {
        when(transactionLogRepository.findByUserId(999)).thenReturn(List.of());

        List<TransactionLog> result = transactionLogService.getLogsByUserId(999);

        assertTrue(result.isEmpty());
        verify(transactionLogRepository).findByUserId(999);
    }

    @Test
    @DisplayName("Should return transaction logs for an account")
    void testGetLogsByAccountId() {
        when(transactionLogRepository.findByAccountId(200)).thenReturn(List.of(testTransactionLog));

        List<TransactionLog> result = transactionLogService.getLogsByAccountId(200);

        assertEquals(List.of(testTransactionLog), result);
        verify(transactionLogRepository).findByAccountId(200);
    }

    @Test
    @DisplayName("Should return transaction logs for a transaction")
    void testGetLogsByTransactionId() {
        when(transactionLogRepository.findByTransactionId(500)).thenReturn(List.of(testTransactionLog));

        List<TransactionLog> result = transactionLogService.getLogsByTransactionId(500);

        assertEquals(List.of(testTransactionLog), result);
        verify(transactionLogRepository).findByTransactionId(500);
    }

    @Test
    @DisplayName("Should return all transaction logs")
    void testGetAllTransactionLogs() {
        when(transactionLogRepository.findAll()).thenReturn(List.of(testTransactionLog));

        List<TransactionLog> result = transactionLogService.getAllTransactionLogs();

        assertEquals(List.of(testTransactionLog), result);
        verify(transactionLogRepository).findAll();
    }

    @Test
    @DisplayName("Should update and return the modified transaction log")
    void testUpdateTransactionLog() {
        when(transactionLogRepository.findById(1)).thenReturn(Optional.of(testTransactionLog));
        when(transactionLogRepository.save(any(TransactionLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionLog result = transactionLogService.updateTransactionLog(1, testTransactionLog);

        assertNotNull(result);
        verify(transactionLogRepository).findById(1);
        verify(transactionLogRepository).save(any(TransactionLog.class));
    }

    @Test
    @DisplayName("Should delete the matching transaction log")
    void testDeleteTransactionLog() {
        doNothing().when(transactionLogRepository).deleteById(1);

        transactionLogService.deleteTransactionLog(1);

        verify(transactionLogRepository).deleteById(1);
    }

}
