package com.tidbits.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "account_holdings")
public class AccountHolding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "holding_id")
    private Integer holdingId;

    @Column(name = "account_id", nullable = false)
    private Integer accountId;

    @Column(name = "instrument_id", nullable = false)
    private Integer instrumentId;

    @Column(name = "quantity")
    private Double quantity;

    @Column(name = "amount_invested")
    private Double amountInvested;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public AccountHolding() {
    }

    public AccountHolding(Integer holdingId, Integer accountId, Integer instrumentId, Double quantity, 
                          Double amountInvested, LocalDateTime lastUpdated) {
        this.holdingId = holdingId;
        this.accountId = accountId;
        this.instrumentId = instrumentId;
        this.quantity = quantity;
        this.amountInvested = amountInvested;
        this.lastUpdated = lastUpdated;
    }

    public Integer getHoldingId() { return holdingId; }
    public void setHoldingId(Integer holdingId) { this.holdingId = holdingId; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public Double getAmountInvested() { return amountInvested; }
    public void setAmountInvested(Double amountInvested) { this.amountInvested = amountInvested; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
