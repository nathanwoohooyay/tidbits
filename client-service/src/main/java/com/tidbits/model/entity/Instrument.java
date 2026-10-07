package com.tidbits.model.entity;

import jakarta.persistence.*;
import com.tidbits.model.enums.InstrumentType;

import java.time.LocalDateTime;

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

    @Column(name = "exchange")
    private String exchange;

    @Column(name = "lastPrice")
    private Double lastPrice;

    @Column(name = "lastUpdated")
    private LocalDateTime lastUpdated;

    @Column(name = "currency")
    private String currency;

    @Column(name = "change")
    private Double change;

    @Column(name = "changePercent")
    private Double changePercent;

    @Column(name = "prevClose")
    private Double prevClose;

    public Instrument() {
    }

    public Instrument(Integer instrumentId, String ticker, String name, InstrumentType type, String exchange) {
        this.instrumentId = instrumentId;
        this.ticker = ticker;
        this.name = name;
        this.type = type;
        this.exchange = exchange;
    }

    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }

    public String getTicker() { return ticker; }
    public void setTicker(String ticker) { this.ticker = ticker; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public InstrumentType getType() { return type; }
    public void setType(InstrumentType type) { this.type = type; }

    public String getExchange() { return exchange; }
    public void setExchange(String exchange) { this.exchange = exchange; }

    public Double getLastPrice() { return lastPrice; }
    public void setLastPrice(Double lastPrice) { this.lastPrice = lastPrice; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Double getChange() { return change; }
    public void setChange(Double change) { this.change = change; }

    public Double getChangePercent() { return changePercent; }
    public void setChangePercent(Double changePercent) { this.changePercent = changePercent; }

    public Double getPrevClose() { return prevClose; }
    public void setPrevClose(Double prevClose) { this.prevClose = prevClose; }
}
