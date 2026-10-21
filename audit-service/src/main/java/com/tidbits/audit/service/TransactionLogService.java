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
        return transactionLogRepository.save(transactionLog);
    }

    public Optional<TransactionLog> getTransactionLogById(Integer logId) {
        return transactionLogRepository.findById(logId);
    }

    public List<TransactionLog> getLogsByUserId(Integer userId) {
        return transactionLogRepository.findByUserId(userId);
    }

    public List<TransactionLog> getLogsByAccountId(Integer accountId) {
        return transactionLogRepository.findByAccountId(accountId);
    }

    public List<TransactionLog> getLogsByTransactionId(Integer transactionId) {
        return transactionLogRepository.findByTransactionId(transactionId);
    }

    public List<TransactionLog> getAllTransactionLogs() {
        return transactionLogRepository.findAll();
    }

    public TransactionLog updateTransactionLog(Integer logId, TransactionLog transactionLog) {
        transactionLog.setLogId(logId);
        return transactionLogRepository.save(transactionLog);
    }

    public void deleteTransactionLog(Integer logId) {
        transactionLogRepository.deleteById(logId);
    }
}
