package com.tidbits.model.entity;

import jakarta.persistence.*;
import com.tidbits.model.enums.LogStatus;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_logs")
public class TransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "account_id")
    private Integer accountId;

    @Column(name = "event")
    private String event;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "transaction_id")
    private Integer transactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private LogStatus status;

    @Column(name = "happened_at")
    private LocalDateTime happenedAt;

    public TransactionLog() {
    }

    public TransactionLog(Integer logId, Integer userId, Integer accountId, String event,
                          String ipAddress, Integer transactionId, LogStatus status, LocalDateTime happenedAt) {
        this.logId = logId;
        this.userId = userId;
        this.accountId = accountId;
        this.event = event;
        this.ipAddress = ipAddress;
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

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Integer getTransactionId() { return transactionId; }
    public void setTransactionId(Integer transactionId) { this.transactionId = transactionId; }

    public LogStatus getStatus() { return status; }
    public void setStatus(LogStatus status) { this.status = status; }

    public LocalDateTime getHappenedAt() { return happenedAt; }
    public void setHappenedAt(LocalDateTime happenedAt) { this.happenedAt = happenedAt; }
}
