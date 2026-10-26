package com.tidbits.model.dto;

import java.math.BigDecimal;

import java.time.LocalDateTime;

public class AccountHoldingDTO {
    private Integer holdingId;
    private Integer instrumentId;
    private BigDecimal quantity;
    private BigDecimal amountInvested;

    public AccountHoldingDTO() {
    }

    public AccountHoldingDTO(Integer holdingId, Integer instrumentId, BigDecimal quantity,
                             BigDecimal amountInvested) {
        this.holdingId = holdingId;
        this.instrumentId = instrumentId;
        this.quantity = quantity;
        this.amountInvested = amountInvested;
    }

    public Integer getHoldingId() { return holdingId; }
    public void setHoldingId(Integer holdingId) { this.holdingId = holdingId; }
    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getAmountInvested() { return amountInvested; }
    public void setAmountInvested(BigDecimal amountInvested) { this.amountInvested = amountInvested; }
}
