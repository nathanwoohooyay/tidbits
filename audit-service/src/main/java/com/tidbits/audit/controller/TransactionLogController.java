package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.TransactionLogDTO;
import com.tidbits.audit.service.TransactionLogService;
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
    public ResponseEntity<TransactionLogDTO> getTransactionLogById(@PathVariable Integer transactionId) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<TransactionLogDTO>> getTransactionLogsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping
    public ResponseEntity<List<TransactionLogDTO>> getAllTransactionLogs() {
        return ResponseEntity.ok(List.of());
    }
}
