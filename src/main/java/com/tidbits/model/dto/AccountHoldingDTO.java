package com.tidbits.model.dto;

import java.time.LocalDateTime;

public class AccountHoldingDTO {
    private Integer holdingId;
    private Integer accountId;
    private Integer instrumentId;
    private Double quantity;
    private Double amountInvested;
    private LocalDateTime lastUpdated;

    public AccountHoldingDTO() {
    }

    public AccountHoldingDTO(Integer holdingId, Integer accountId, Integer instrumentId, Double quantity,
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
