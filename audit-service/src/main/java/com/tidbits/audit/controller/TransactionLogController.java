package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.TransactionLogDTO;
import com.tidbits.audit.model.entity.TransactionLog;
import com.tidbits.audit.service.TransactionLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs/transactions")
public class TransactionLogController {

    @Autowired
    private TransactionLogService transactionLogService;

    @PostMapping
    public ResponseEntity<TransactionLogDTO> createTransactionLog(@RequestBody TransactionLog transactionLog) {
        return ResponseEntity.ok(toDto(transactionLogService.createTransactionLog(transactionLog)));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionLogDTO> getTransactionLogById(@PathVariable Integer transactionId) {
        return transactionLogService.getTransactionLogById(transactionId)
                .map(log -> ResponseEntity.ok(toDto(log)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<TransactionLogDTO>> getTransactionLogsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(transactionLogService.getLogsByUserId(userId).stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<List<TransactionLogDTO>> getTransactionLogsByAccountId(@PathVariable Integer accountId) {
        return ResponseEntity.ok(transactionLogService.getLogsByAccountId(accountId).stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping
    public ResponseEntity<List<TransactionLogDTO>> getAllTransactionLogs() {
        return ResponseEntity.ok(transactionLogService.getAllTransactionLogs().stream().map(this::toDto).collect(Collectors.toList()));
    }

    private TransactionLogDTO toDto(TransactionLog log) {
        return new TransactionLogDTO(
                log.getLogId(),
                log.getUserId(),
                log.getAccountId(),
                log.getEvent(),
            log.getAmount(),
                log.getIpAddress(),
                log.getTransactionId(),
                log.getStatus(),
                log.getHappenedAt()
        );
    }
}
