package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.TransactionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionLogRepository extends JpaRepository<TransactionLog, Integer> {
    List<TransactionLog> findByUserId(Integer userId);
    List<TransactionLog> findByAccountId(Integer accountId);
    List<TransactionLog> findByTransactionId(Integer transactionId);
}
