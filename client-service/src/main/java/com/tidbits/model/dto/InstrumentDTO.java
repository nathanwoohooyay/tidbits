package com.tidbits.model.dto;

import com.tidbits.model.enums.InstrumentType;

public class InstrumentDTO {
    private Integer instrumentId;
    private String ticker;
    private String name;
    private InstrumentType type;
    private String market;

    public InstrumentDTO() {
    }

    public InstrumentDTO(Integer instrumentId, String ticker, String name, InstrumentType type, String market) {
        this.instrumentId = instrumentId;
        this.ticker = ticker;
        this.name = name;
        this.type = type;
        this.market = market;
    }

    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }
    public String getTicker() { return ticker; }
    public void setTicker(String ticker) { this.ticker = ticker; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public InstrumentType getType() { return type; }
    public void setType(InstrumentType type) { this.type = type; }
    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }
}
