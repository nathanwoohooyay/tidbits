package com.tidbits.controller;

import com.tidbits.model.dto.PricingBatchResponseDTO;
import com.tidbits.model.dto.PricingCandlesResponseDTO;
import com.tidbits.service.PricingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    private final PricingService pricingService;

    public PricingController(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    @GetMapping("/quotes")
    public ResponseEntity<PricingBatchResponseDTO> getQuotes(@RequestParam String symbols, @RequestParam(required = false, defaultValue = "false") boolean refresh) {
        List<String> requestedSymbols = Arrays.stream(symbols.split(","))
                .map(String::trim)
                .filter(symbol -> !symbol.isBlank())
                .toList();

        return ResponseEntity.ok(pricingService.getBatchQuotes(requestedSymbols, refresh));
    }

    @GetMapping("/candles/{symbol}")
    public ResponseEntity<PricingCandlesResponseDTO> getHistoricalCandles(
            @PathVariable String symbol,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false, defaultValue = "1d") String interval
    ) {
        PricingCandlesResponseDTO candlesResponse = pricingService.getHistoricalCandles(symbol, from, to, interval);

        if (isAcceptedBackfillResponse(candlesResponse)) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(candlesResponse);
        }

        return ResponseEntity.ok(candlesResponse);
    }

    private boolean isAcceptedBackfillResponse(PricingCandlesResponseDTO response) {
        return response != null
                && Boolean.TRUE.equals(response.partial())
                && response.asOf() == null
                && response.candles() != null
                && response.candles().isEmpty();
    }
}
