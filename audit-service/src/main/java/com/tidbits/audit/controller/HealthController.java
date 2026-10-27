package com.tidbits.audit.controller;

import com.tidbits.audit.service.DependencyChecks;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

// Whether this service and what it depends on are working, for the gateway's service status. 503 when the database
// or Kafka is down.
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DependencyChecks dependencyChecks;

    public HealthController(DependencyChecks dependencyChecks) {
        this.dependencyChecks = dependencyChecks;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        CompletableFuture<DependencyChecks.Result> database = dependencyChecks.database();
        CompletableFuture<DependencyChecks.Result> kafka = dependencyChecks.kafka();
        Map<String, DependencyChecks.Result> checks = new LinkedHashMap<>();
        checks.put("database", database.join());
        checks.put("kafka", kafka.join());
        boolean up = checks.values().stream().allMatch(DependencyChecks.Result::ok);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", up ? "up" : "down");
        body.put("checks", checks);
        return ResponseEntity.status(up ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
