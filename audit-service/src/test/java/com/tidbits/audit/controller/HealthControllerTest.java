package com.tidbits.audit.controller;

import com.tidbits.audit.service.DependencyChecks;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthControllerTest {

    private final DependencyChecks dependencyChecks = mock(DependencyChecks.class);
    private final HealthController controller = new HealthController(dependencyChecks);

    @Test
    void upWhenTheDatabaseAndKafkaAre() {
        when(dependencyChecks.database()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("up", 3L, null)));
        when(dependencyChecks.kafka()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("up", 9L, null)));

        ResponseEntity<Map<String, Object>> response = controller.health();

        assertEquals(200, response.getStatusCode().value());
        assertEquals("up", response.getBody().get("status"));
    }

    @Test
    void unavailableWhenTheDatabaseIsDown() {
        when(dependencyChecks.database()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("down", null, "Database unreachable")));
        when(dependencyChecks.kafka()).thenReturn(CompletableFuture.completedFuture(new DependencyChecks.Result("up", 9L, null)));

        ResponseEntity<Map<String, Object>> response = controller.health();

        assertEquals(503, response.getStatusCode().value());
        assertEquals("down", response.getBody().get("status"));
    }
}
