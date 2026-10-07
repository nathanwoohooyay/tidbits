package com.tidbits.model.dto;

import com.tidbits.model.enums.TransactionType;
import java.time.LocalDateTime;

public class AccountTransactionDTO {
    private Integer transactionId;
    private Integer orderId;
    private Double amount;
    private TransactionType transactionType;

    public AccountTransactionDTO() {
    }

    public AccountTransactionDTO(Integer transactionId, Integer orderId, Double amount,
                                 TransactionType transactionType) {
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.amount = amount;
        this.transactionType = transactionType;
    }

    public Integer getTransactionId() { return transactionId; }
    public void setTransactionId(Integer transactionId) { this.transactionId = transactionId; }
    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
}
