package com.tidbits.model.entity;

import com.tidbits.model.enums.PointsEventType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "points_transactions")
public class PointsTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "points_transaction_id")
    private Integer pointsTransactionId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "account_id")
    private Integer accountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private PointsEventType eventType;

    @Column(name = "points_delta", nullable = false)
    private Integer pointsDelta;

    @Column(name = "balance_after", nullable = false)
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

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PointsTransaction() {
    }

    public Integer getPointsTransactionId() { return pointsTransactionId; }
    public void setPointsTransactionId(Integer pointsTransactionId) { this.pointsTransactionId = pointsTransactionId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public PointsEventType getEventType() { return eventType; }
    public void setEventType(PointsEventType eventType) { this.eventType = eventType; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
