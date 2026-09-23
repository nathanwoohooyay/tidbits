package com.tidbits.controller;

import com.tidbits.model.dto.InstrumentDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.service.InstrumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instruments")
public class InstrumentController {

    @Autowired
    private InstrumentService instrumentService;

    @PostMapping
    public ResponseEntity<InstrumentDTO> createInstrument(@RequestBody Instrument instrument) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{instrumentId}")
    public ResponseEntity<InstrumentDTO> getInstrumentById(@PathVariable Integer instrumentId) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<InstrumentDTO>> getAllInstruments() {
        return ResponseEntity.ok(List.of());
    }

    @PatchMapping("/{instrumentId}")
    public ResponseEntity<InstrumentDTO> updateInstrument(@PathVariable Integer instrumentId, @RequestBody Instrument instrument) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{instrumentId}")
    public ResponseEntity<Void> deleteInstrument(@PathVariable Integer instrumentId) {
        return ResponseEntity.noContent().build();
    }
}
