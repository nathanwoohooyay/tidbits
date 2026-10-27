package com.tidbits.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MarketDataHealthTest {

    private static final Instant START = Instant.parse("2026-10-26T15:00:00Z");

    private final MovableClock clock = new MovableClock();
    private final MarketDataHealth health = new MarketDataHealth(clock);

    @Test
    void upWhileCallsKeepSucceeding() {
        health.recordSuccess();
        clock.advance(Duration.ofMinutes(9));

        MarketDataHealth.Snapshot snapshot = health.snapshot(true);

        assertEquals(MarketDataHealth.State.UP, snapshot.state());
        assertNull(snapshot.reason());
        assertEquals(START, snapshot.lastSuccessAt());
    }

    @Test
    void unknownOnceTheLastSuccessIsOld() {
        assertEquals("No prices fetched yet", health.snapshot(true).reason());
        health.recordSuccess();
        clock.advance(Duration.ofMinutes(11));

        MarketDataHealth.Snapshot snapshot = health.snapshot(true);

        assertEquals(MarketDataHealth.State.UNKNOWN, snapshot.state());
        assertEquals("No recent prices", snapshot.reason());
    }

    @Test
    void aFailureAfterTheLastSuccessWinsUntilACallSucceedsAgain() {
        health.recordSuccess();
        clock.advance(Duration.ofSeconds(30));
        health.recordFailure("API key rejected", false);

        assertEquals(MarketDataHealth.State.DOWN, health.snapshot(true).state());
        assertEquals("API key rejected", health.snapshot(true).reason());

        clock.advance(Duration.ofSeconds(30));
        health.recordSuccess();
        assertEquals(MarketDataHealth.State.UP, health.snapshot(true).state());
    }

    @Test
    void rateLimitingIsDegradedNotDown() {
        health.recordFailure("Rate limited", true);

        assertEquals(MarketDataHealth.State.DEGRADED, health.snapshot(true).state());
    }

    @Test
    void downWithoutAnApiKey() {
        health.recordSuccess();

        MarketDataHealth.Snapshot snapshot = health.snapshot(false);

        assertEquals(MarketDataHealth.State.DOWN, snapshot.state());
        assertEquals("API key not set", snapshot.reason());
    }

    @Test
    void probesOnlyAfterAQuietSpellAndThenAtMostEveryFiveMinutes() {
        health.recordSuccess();
        clock.advance(Duration.ofMinutes(4));
        assertFalse(health.shouldProbe());

        clock.advance(Duration.ofMinutes(2));
        assertTrue(health.shouldProbe());
        assertFalse(health.shouldProbe());

        clock.advance(Duration.ofMinutes(5).plusSeconds(1));
        assertTrue(health.shouldProbe());
    }

    @Test
    void interceptorRecordsEachResponse() throws IOException {
        assertEquals(MarketDataHealth.State.UP, afterResponse(HttpStatus.OK).state());
        assertEquals(MarketDataHealth.State.UP, afterResponse(HttpStatus.NOT_FOUND).state());
        assertEquals("API key rejected", afterResponse(HttpStatus.UNAUTHORIZED).reason());
        assertEquals(MarketDataHealth.State.DEGRADED, afterResponse(HttpStatus.TOO_MANY_REQUESTS).state());
        assertEquals("Feed returned an error", afterResponse(HttpStatus.BAD_GATEWAY).reason());
    }

    @Test
    void interceptorRecordsConnectionFailures() throws IOException {
        ClientHttpRequestExecution execution = mock(ClientHttpRequestExecution.class);
        when(execution.execute(any(), any())).thenThrow(new IOException("connection refused"));

        assertThrows(IOException.class, () -> health.interceptor().intercept(mock(HttpRequest.class), new byte[0], execution));

        assertEquals(MarketDataHealth.State.DOWN, health.snapshot(true).state());
        assertEquals("Not reachable", health.snapshot(true).reason());
    }

    private MarketDataHealth.Snapshot afterResponse(HttpStatus status) throws IOException {
        clock.advance(Duration.ofSeconds(1));
        ClientHttpResponse response = mock(ClientHttpResponse.class);
        when(response.getStatusCode()).thenReturn(status);
        ClientHttpRequestExecution execution = mock(ClientHttpRequestExecution.class);
        when(execution.execute(any(), any())).thenReturn(response);
        health.interceptor().intercept(mock(HttpRequest.class), new byte[0], execution);
        return health.snapshot(true);
    }

    private static final class MovableClock extends Clock {
        private Instant now = START;

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
