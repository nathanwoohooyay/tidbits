package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.TransactionLog;
import com.tidbits.audit.repository.TransactionLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TransactionLogService {

    @Autowired
    private TransactionLogRepository transactionLogRepository;

    public TransactionLog createTransactionLog(TransactionLog transactionLog) {
        return null;
    }

    public Optional<TransactionLog> getTransactionLogById(Integer logId) {

        return Optional.empty();
    }

    public List<TransactionLog> getLogsByUserId(Integer userId) {
        return List.of();
    }

    public List<TransactionLog> getLogsByAccountId(Integer accountId) {
        return List.of();
    }

    public List<TransactionLog> getLogsByTransactionId(Integer transactionId) {
        return List.of();
    }

    public List<TransactionLog> getAllTransactionLogs() {
        return List.of();
    }

    public TransactionLog updateTransactionLog(Integer logId, TransactionLog transactionLog) {
        return null;
    }

    public void deleteTransactionLog(Integer logId) {
    }
}
