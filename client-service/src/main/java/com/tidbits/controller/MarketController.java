package com.tidbits.controller;

import com.tidbits.service.MarketHoursService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    @Autowired
    private MarketHoursService marketHoursService;

    @GetMapping("/status")
    public ResponseEntity<MarketHoursService.MarketStatus> getStatus() {
        return ResponseEntity.ok(marketHoursService.status());
    }
}
