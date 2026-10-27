package com.tidbits.service;

import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

// What the app last heard from Fauxnance, the price feed. Every call PricingService makes is recorded through
// interceptor(), so the admin dashboard can tell whether prices are flowing without spending an API call each time it
// asks; only when the feed has been quiet for a while does the health check ask it for one quote (see shouldProbe).
@Component
public class MarketDataHealth {

    // A successful call this recent means prices are flowing.
    static final Duration FRESH = Duration.ofMinutes(10);
    // When nothing has been heard for this long, the health check asks the feed itself, at most this often.
    static final Duration PROBE_INTERVAL = Duration.ofMinutes(5);

    public enum State { UP, DEGRADED, DOWN, UNKNOWN }

    public record Snapshot(State state, String reason, Instant lastSuccessAt) {
    }

    private record Failure(Instant at, String reason, boolean degraded) {
    }

    private final Clock clock;
    private final AtomicReference<Instant> lastSuccessAt = new AtomicReference<>();
    private final AtomicReference<Failure> lastFailure = new AtomicReference<>();
    private final AtomicReference<Instant> lastProbeAt = new AtomicReference<>();

    public MarketDataHealth(Clock clock) {
        this.clock = clock;
    }

    // Records the outcome of every Fauxnance call. A 400 or 404 is about the symbol asked for, so it still counts as
    // the feed answering.
    public ClientHttpRequestInterceptor interceptor() {
        return (request, body, execution) -> {
            ClientHttpResponse response;
            try {
                response = execution.execute(request, body);
            } catch (IOException ex) {
                recordFailure("Not reachable", false);
                throw ex;
            }
            int status = response.getStatusCode().value();
            if (status == 401 || status == 403) {
                recordFailure("API key rejected", false);
            } else if (status == 429) {
                recordFailure("Rate limited", true);
            } else if (status >= 500) {
                recordFailure("Feed returned an error", false);
            } else {
                recordSuccess();
            }
            return response;
        };
    }

    void recordSuccess() {
        lastSuccessAt.set(clock.instant());
    }

    void recordFailure(String reason, boolean degraded) {
        lastFailure.set(new Failure(clock.instant(), reason, degraded));
    }

    public Snapshot snapshot(boolean apiKeyConfigured) {
        Instant success = lastSuccessAt.get();
        if (!apiKeyConfigured) {
            return new Snapshot(State.DOWN, "API key not set", success);
        }
        Failure failure = lastFailure.get();
        if (failure != null && (success == null || failure.at().isAfter(success))) {
            return new Snapshot(failure.degraded() ? State.DEGRADED : State.DOWN, failure.reason(), success);
        }
        if (success != null && success.isAfter(clock.instant().minus(FRESH))) {
            return new Snapshot(State.UP, null, success);
        }
        return new Snapshot(State.UNKNOWN, success == null ? "No prices fetched yet" : "No recent prices", success);
    }

    // True for the one caller that should ask the feed now: nothing heard for PROBE_INTERVAL, and no probe since.
    public boolean shouldProbe() {
        Instant now = clock.instant();
        Instant cutoff = now.minus(PROBE_INTERVAL);
        Failure failure = lastFailure.get();
        Instant success = lastSuccessAt.get();
        boolean heardRecently = (success != null && success.isAfter(cutoff)) || (failure != null && failure.at().isAfter(cutoff));
        if (heardRecently) {
            return false;
        }
        Instant previous = lastProbeAt.get();
        if (previous != null && previous.isAfter(cutoff)) {
            return false;
        }
        return lastProbeAt.compareAndSet(previous, now);
    }
}
