package com.tidbits.model.entity;

import jakarta.persistence.*;
import com.tidbits.model.enums.InstrumentType;

@Entity
@Table(name = "instruments")
public class Instrument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "instrument_id")
    private Integer instrumentId;

    @Column(name = "ticker", nullable = false, unique = true)
    private String ticker;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private InstrumentType type;

    @Column(name = "market")
    private String market;

    public Instrument() {
    }

    public Instrument(Integer instrumentId, String ticker, String name, InstrumentType type, String market) {
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
