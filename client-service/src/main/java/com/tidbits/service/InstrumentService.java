package com.tidbits.service;

import com.tidbits.model.entity.Instrument;
import com.tidbits.repository.InstrumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InstrumentService {

    @Autowired
    private InstrumentRepository instrumentRepository;

    public Instrument createInstrument(Instrument instrument) {
        return null;
    }

    public Optional<Instrument> getInstrumentById(Integer instrumentId) {
        return Optional.empty();
    }

    public Optional<Instrument> getInstrumentByTicker(String ticker) {
        return Optional.empty();
    }

    public List<Instrument> getAllInstruments() {
        return List.of();
    }

    public Instrument updateInstrument(Integer instrumentId, Instrument instrument) {
        return null;
    }

    public void deleteInstrument(Integer instrumentId) {
    }
}
