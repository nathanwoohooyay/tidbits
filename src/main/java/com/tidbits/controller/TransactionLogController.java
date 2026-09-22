package com.tidbits.controller;

import com.tidbits.model.entity.TransactionLog;
import com.tidbits.service.TransactionLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transaction-logs")
public class TransactionLogController {

    @Autowired
    private TransactionLogService transactionLogService;

    @PostMapping
    public ResponseEntity<TransactionLog> createTransactionLog(@RequestBody TransactionLog transactionLog) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionLog> getTransactionLogById(@PathVariable Integer id) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<TransactionLog>> getAllTransactionLogs() {
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionLog> updateTransactionLog(@PathVariable Integer id, @RequestBody TransactionLog transactionLog) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransactionLog(@PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }
}
