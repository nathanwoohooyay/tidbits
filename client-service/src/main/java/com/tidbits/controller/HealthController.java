package com.tidbits.controller;

import com.tidbits.service.DependencyChecks;
import com.tidbits.service.MarketDataHealth;
import com.tidbits.service.PricingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

// Whether this service and what it depends on are working, for the gateway's service status. 503 when the database
// or Kafka is down. The price feed is reported on its own: prices failing doesn't stop the service.
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DependencyChecks dependencyChecks;
    private final PricingService pricingService;

    public HealthController(DependencyChecks dependencyChecks, PricingService pricingService) {
        this.dependencyChecks = dependencyChecks;
        this.pricingService = pricingService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        CompletableFuture<DependencyChecks.Result> database = dependencyChecks.database();
        CompletableFuture<DependencyChecks.Result> kafka = dependencyChecks.kafka();
        Map<String, DependencyChecks.Result> checks = new LinkedHashMap<>();
        checks.put("database", database.join());
        checks.put("kafka", kafka.join());
        boolean up = checks.values().stream().allMatch(DependencyChecks.Result::ok);

        MarketDataHealth.Snapshot feed = pricingService.checkFeed();
        Map<String, Object> marketData = new LinkedHashMap<>();
        marketData.put("status", feed.state().name().toLowerCase(Locale.ROOT));
        if (feed.reason() != null) {
            marketData.put("reason", feed.reason());
        }
        if (feed.lastSuccessAt() != null) {
            marketData.put("lastSuccessAt", feed.lastSuccessAt().toString());
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", up ? "up" : "down");
        body.put("checks", checks);
        body.put("marketData", marketData);
        return ResponseEntity.status(up ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
