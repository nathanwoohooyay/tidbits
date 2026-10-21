package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.TransactionLogDTO;
import com.tidbits.audit.model.entity.TransactionLog;
import com.tidbits.audit.model.enums.LogStatus;
import com.tidbits.audit.service.TransactionLogService;
import com.tidbits.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionLogControllerTest {

    @Mock
    private TransactionLogService transactionLogService;

    @InjectMocks
    private TransactionLogController transactionLogController;

    @Test
    void createTransactionLog_returnsMappedDto() {
        TransactionLog saved = tx(11, 5, 7, "ORDER_PLACED", 40.0, 99, LogStatus.SUCCESS);
        when(transactionLogService.createTransactionLog(saved)).thenReturn(saved);

        ResponseEntity<TransactionLogDTO> response = transactionLogController.createTransactionLog(saved);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(11, response.getBody().getLogId());
        assertEquals(99, response.getBody().getTransactionId());
    }

    @Test
    void getTransactionLogById_throwsWhenMissing() {
        when(transactionLogService.getTransactionLogById(77)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> transactionLogController.getTransactionLogById(77));
    }

    @Test
    void getTransactionLogsByUserId_returnsMappedDtos() {
        when(transactionLogService.getLogsByUserId(5)).thenReturn(List.of(
                tx(1, 5, 7, "DEPOSIT", 10.0, 100, LogStatus.SUCCESS),
                tx(2, 5, 7, "WITHDRAW", 5.0, 101, LogStatus.FAILURE)
        ));

        ResponseEntity<List<TransactionLogDTO>> response = transactionLogController.getTransactionLogsByUserId(5);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
        assertEquals("WITHDRAW", response.getBody().get(1).getEvent());
    }

    private TransactionLog tx(Integer id, Integer userId, Integer accountId, String event, Double amount,
                              Integer transactionId, LogStatus status) {
        return new TransactionLog(id, userId, accountId, event, amount, transactionId, status, LocalDateTime.now());
    }
}
