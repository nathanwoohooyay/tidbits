package com.tidbits.audit.model.dto;

import com.tidbits.audit.model.enums.LogStatus;
import java.time.LocalDateTime;

public class TransactionLogDTO {
    private Integer logId;
    private Integer userId;
    private Integer accountId;
    private Integer instrumentId;
    private String ticker;
    private String orderType;
    private Double quantity;
    private String event;
    private Double amount;
    private Integer orderId;
    private Double stockPrice;
    private Integer transactionId;
    private LogStatus status;
    private LocalDateTime happenedAt;

    public TransactionLogDTO() {
    }

    public TransactionLogDTO(Integer logId, Integer userId, Integer accountId, Integer instrumentId,
                             String ticker, String orderType, Double quantity, String event, Double amount,
                             Integer orderId, Double stockPrice, Integer transactionId, LogStatus status, LocalDateTime happenedAt) {
        this.logId = logId;
        this.userId = userId;
        this.accountId = accountId;
        this.instrumentId = instrumentId;
        this.ticker = ticker;
        this.orderType = orderType;
        this.quantity = quantity;
        this.event = event;
        this.amount = amount;
        this.orderId = orderId;
        this.stockPrice = stockPrice;
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
    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }
    public String getTicker() { return ticker; }
    public void setTicker(String ticker) { this.ticker = ticker; }
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public Double getStockPrice() { return stockPrice; }
    public void setStockPrice(Double stockPrice) { this.stockPrice = stockPrice; }
    public Integer getTransactionId() { return transactionId; }
    public void setTransactionId(Integer transactionId) { this.transactionId = transactionId; }
    public LogStatus getStatus() { return status; }
    public void setStatus(LogStatus status) { this.status = status; }
    public LocalDateTime getHappenedAt() { return happenedAt; }
    public void setHappenedAt(LocalDateTime happenedAt) { this.happenedAt = happenedAt; }
}
