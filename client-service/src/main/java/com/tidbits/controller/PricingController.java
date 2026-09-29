package com.tidbits.controller;

import com.tidbits.model.dto.PricingBatchResponseDTO;
import com.tidbits.service.PricingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<PricingBatchResponseDTO> getQuotes(@RequestParam String symbols) {
        List<String> requestedSymbols = Arrays.stream(symbols.split(","))
                .map(String::trim)
                .filter(symbol -> !symbol.isBlank())
                .toList();

        return ResponseEntity.ok(pricingService.getBatchQuotes(requestedSymbols));
    }
}
