package com.tidbits.model.dto;

import java.time.LocalDateTime;

public class AccountHoldingDTO {
    private Integer holdingId;
    private Integer instrumentId;
    private Double quantity;
    private Double amountInvested;

    public AccountHoldingDTO() {
    }

    public AccountHoldingDTO(Integer holdingId, Integer instrumentId, Double quantity,
                             Double amountInvested) {
        this.holdingId = holdingId;
        this.instrumentId = instrumentId;
        this.quantity = quantity;
        this.amountInvested = amountInvested;
    }

    public Integer getHoldingId() { return holdingId; }
    public void setHoldingId(Integer holdingId) { this.holdingId = holdingId; }
    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getAmountInvested() { return amountInvested; }
    public void setAmountInvested(Double amountInvested) { this.amountInvested = amountInvested; }
}
