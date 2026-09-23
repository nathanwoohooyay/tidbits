package com.tidbits.controller;

import com.tidbits.model.entity.TransactionLog;
import com.tidbits.service.TransactionLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs/transactions")
public class TransactionLogController {

    @Autowired
    private TransactionLogService transactionLogService;

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionLog> getTransactionLogById(@PathVariable Integer transactionId) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<TransactionLog>> getTransactionLogsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping
    public ResponseEntity<List<TransactionLog>> getAllTransactionLogs() {
        return ResponseEntity.ok(List.of());
    }
}
