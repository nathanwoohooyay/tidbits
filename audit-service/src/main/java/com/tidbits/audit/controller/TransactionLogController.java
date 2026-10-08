package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.TransactionLogDTO;
import com.tidbits.audit.model.entity.OrderRef;
import com.tidbits.audit.model.entity.TransactionLog;
import com.tidbits.audit.repository.OrderRefRepository;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.audit.service.TransactionLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs/transactions")
public class TransactionLogController {

    @Autowired
    private TransactionLogService transactionLogService;

    @Autowired
    private OrderRefRepository orderRefRepository;

    @PostMapping
    public ResponseEntity<TransactionLogDTO> createTransactionLog(@RequestBody TransactionLog transactionLog) {
        return ResponseEntity.ok(toDto(transactionLogService.createTransactionLog(transactionLog)));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionLogDTO> getTransactionLogById(@PathVariable Integer transactionId) {
        TransactionLog log = transactionLogService.getTransactionLogById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction log not found for id: " + transactionId));
        return ResponseEntity.ok(toDto(log));
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
        Optional<OrderRef> order = resolveOrder(log.getOrderId());
        String orderType = order.map(OrderRef::getOrderType)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .orElse(null);
        Double quantity = order.map(OrderRef::getQuantity).orElse(null);
        Double stockPrice = log.getStockPrice() != null
                ? log.getStockPrice()
                : order.map(OrderRef::getStockPrice).orElse(null);

        return new TransactionLogDTO(
                log.getLogId(),
                log.getUserId(),
                log.getAccountId(),
                order.map(OrderRef::getInstrumentId).orElse(null),
                orderType,
                quantity,
                log.getEvent(),
                log.getAmount(),
                log.getOrderId(),
                stockPrice,
                log.getTransactionId(),
                log.getStatus(),
                log.getHappenedAt()
        );
    }

    private Optional<OrderRef> resolveOrder(Integer orderId) {
        if (orderId == null || orderRefRepository == null) {
            return Optional.empty();
        }

        return orderRefRepository.findById(orderId);
    }
}
