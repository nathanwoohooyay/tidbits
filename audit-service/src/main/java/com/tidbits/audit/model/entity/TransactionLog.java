package com.tidbits.audit.model.entity;

import com.tidbits.audit.model.converter.LogStatusConverter;
import jakarta.persistence.*;
import com.tidbits.audit.model.enums.LogStatus;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_logs")
public class TransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "stock_price")
    private Double stockPrice;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "account_id")
    private Integer accountId;

    @Column(name = "event")
    private String event;

    @Column(name = "amount")
    private Double amount;

    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "transaction_id")
    private Integer transactionId;

    @Convert(converter = LogStatusConverter.class)
    @Column(name = "status")
    private LogStatus status;

    @Column(name = "happened_at")
    private LocalDateTime happenedAt;

    public TransactionLog() {
    }

    public TransactionLog(Integer logId, Integer userId, Integer accountId, Integer orderId, String event, Double stockPrice, Double amount,
                          Integer transactionId, LogStatus status, LocalDateTime happenedAt) {
        this.logId = logId;
        this.userId = userId;
        this.accountId = accountId;
        this.event = event;
        this.stockPrice = stockPrice;
        this.amount = amount;
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.status = status;
        this.happenedAt = happenedAt;
    }

    public Integer getLogId() { return logId; }
    public void setLogId(Integer logId) { this.logId = logId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public Integer getTransactionId() { return transactionId; }
    public void setTransactionId(Integer transactionId) { this.transactionId = transactionId; }

    public LogStatus getStatus() { return status; }
    public void setStatus(LogStatus status) { this.status = status; }

    public LocalDateTime getHappenedAt() { return happenedAt; }
    public void setHappenedAt(LocalDateTime happenedAt) { this.happenedAt = happenedAt; }

    public Double getStockPrice() { return stockPrice; }
    public void setStockPrice(Double stockPrice) { this.stockPrice = stockPrice; }
}
