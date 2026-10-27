package com.tidbits.controller;

import com.tidbits.service.DependencyChecks;
import com.tidbits.service.MarketDataHealth;
import com.tidbits.service.PricingService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthControllerTest {

    private final DependencyChecks dependencyChecks = mock(DependencyChecks.class);
    private final PricingService pricingService = mock(PricingService.class);
    private final HealthController controller = new HealthController(dependencyChecks, pricingService);

    @Test
    void upWhenTheDatabaseAndKafkaAre() {
        when(dependencyChecks.database()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("up", 3L, null)));
        when(dependencyChecks.kafka()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("up", 9L, null)));
        when(pricingService.checkFeed()).thenReturn(new MarketDataHealth.Snapshot(MarketDataHealth.State.UP, null, Instant.parse("2026-10-26T15:00:00Z")));

        ResponseEntity<Map<String, Object>> response = controller.health();

        assertEquals(200, response.getStatusCode().value());
        assertEquals("up", response.getBody().get("status"));
        assertEquals(Map.of("status", "up", "lastSuccessAt", "2026-10-26T15:00:00Z"), response.getBody().get("marketData"));
    }

    @Test
    void unavailableWhenKafkaIsDownButThePriceFeedDoesNotCount() {
        when(dependencyChecks.database()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("up", 3L, null)));
        when(dependencyChecks.kafka()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("down", null, "Kafka unreachable")));
        when(pricingService.checkFeed()).thenReturn(new MarketDataHealth.Snapshot(MarketDataHealth.State.DOWN, "API key rejected", null));

        ResponseEntity<Map<String, Object>> response = controller.health();

        assertEquals(503, response.getStatusCode().value());
        assertEquals("down", response.getBody().get("status"));
        assertEquals(Map.of("status", "down", "reason", "API key rejected"), response.getBody().get("marketData"));
    }
}
