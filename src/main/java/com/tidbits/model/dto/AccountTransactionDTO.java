package com.tidbits.model.dto;

import com.tidbits.model.enums.TransactionType;
import java.time.LocalDateTime;

public class AccountTransactionDTO {
    private Integer transactionId;
    private Integer accountId;
    private Integer orderId;
    private Double amount;
    private TransactionType transactionType;
    private LocalDateTime createdAt;

    public AccountTransactionDTO() {
    }

    public AccountTransactionDTO(Integer transactionId, Integer accountId, Integer orderId, Double amount,
                                 TransactionType transactionType, LocalDateTime createdAt) {
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.orderId = orderId;
        this.amount = amount;
        this.transactionType = transactionType;
        this.createdAt = createdAt;
    }

    public Integer getTransactionId() { return transactionId; }
    public void setTransactionId(Integer transactionId) { this.transactionId = transactionId; }
    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
