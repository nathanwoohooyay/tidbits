package com.tidbits.audit.model.entity;

import com.tidbits.audit.model.converter.LogStatusConverter;
import com.tidbits.audit.model.enums.LogStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "points_logs")
public class PointsLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "account_id")
    private Integer accountId;

    @Column(name = "points_transaction_id")
    private Integer pointsTransactionId;

    @Column(name = "event")
    private String event;

    @Column(name = "points_delta")
    private Integer pointsDelta;

    @Column(name = "balance_after")
    private Integer balanceAfter;

    @Column(name = "cash_value")
    private Double cashValue;

    @Column(name = "instrument_id")
    private Integer instrumentId;

    @Column(name = "quantity")
    private Double quantity;

    @Column(name = "reference_id")
    private Integer referenceId;

    @Column(name = "details")
    private String details;

    @Convert(converter = LogStatusConverter.class)
    @Column(name = "status")
    private LogStatus status;

    @Column(name = "happened_at")
    private LocalDateTime happenedAt;

    public PointsLog() {
    }

    public Integer getLogId() { return logId; }
    public void setLogId(Integer logId) { this.logId = logId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public Integer getPointsTransactionId() { return pointsTransactionId; }
    public void setPointsTransactionId(Integer pointsTransactionId) { this.pointsTransactionId = pointsTransactionId; }

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }

    public Integer getPointsDelta() { return pointsDelta; }
    public void setPointsDelta(Integer pointsDelta) { this.pointsDelta = pointsDelta; }

    public Integer getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(Integer balanceAfter) { this.balanceAfter = balanceAfter; }

    public Double getCashValue() { return cashValue; }
    public void setCashValue(Double cashValue) { this.cashValue = cashValue; }

    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public Integer getReferenceId() { return referenceId; }
    public void setReferenceId(Integer referenceId) { this.referenceId = referenceId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public LogStatus getStatus() { return status; }
    public void setStatus(LogStatus status) { this.status = status; }

    public LocalDateTime getHappenedAt() { return happenedAt; }
    public void setHappenedAt(LocalDateTime happenedAt) { this.happenedAt = happenedAt; }
}
