package com.tidbits.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

// Database and Kafka checks for the health endpoint. Each gives up after a couple of seconds, so a hung dependency
// reports as down instead of stalling the endpoint (a connection from the pool would otherwise wait 30 s).
@Component
public class DependencyChecks {

    static final Duration TIMEOUT = Duration.ofSeconds(2);

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Result(String status, Long latencyMs, String reason) {
        static Result up(long latencyMs) {
            return new Result("up", latencyMs, null);
        }

        static Result down(String reason) {
            return new Result("down", null, reason);
        }

        public boolean ok() {
            return "up".equals(status);
        }
    }

    private final DataSource dataSource;
    private final KafkaAdmin kafkaAdmin;
    // Checks block on I/O, so they get their own threads rather than the shared fork-join pool.
    private final ExecutorService executor = Executors.newCachedThreadPool(runnable -> {
        Thread thread = new Thread(runnable, "health-check");
        thread.setDaemon(true);
        return thread;
    });

    public DependencyChecks(DataSource dataSource, KafkaAdmin kafkaAdmin) {
        this.dataSource = dataSource;
        this.kafkaAdmin = kafkaAdmin;
    }

    public CompletableFuture<Result> database() {
        return bounded(() -> {
            long started = System.nanoTime();
            try (Connection connection = dataSource.getConnection()) {
                return connection.isValid((int) TIMEOUT.toSeconds())
                        ? Result.up(elapsedMs(started))
                        : Result.down("Database not answering");
            } catch (SQLException ex) {
                return Result.down("Database unreachable");
            }
        }, "Database not answering");
    }

    public CompletableFuture<Result> kafka() {
        return bounded(() -> {
            long started = System.nanoTime();
            Map<String, Object> config = new HashMap<>(kafkaAdmin.getConfigurationProperties());
            config.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, (int) TIMEOUT.toMillis());
            config.put(AdminClientConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, (int) TIMEOUT.toMillis());
            AdminClient admin = AdminClient.create(config);
            try {
                boolean hasBrokers = !admin.describeCluster().nodes().get(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS).isEmpty();
                return hasBrokers ? Result.up(elapsedMs(started)) : Result.down("No Kafka brokers");
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                return Result.down("Kafka unreachable");
            } catch (Exception ex) {
                return Result.down("Kafka unreachable");
            } finally {
                admin.close(Duration.ZERO);
            }
        }, "Kafka unreachable");
    }

    private CompletableFuture<Result> bounded(Supplier<Result> check, String failureReason) {
        return CompletableFuture.supplyAsync(check, executor)
                .completeOnTimeout(Result.down(failureReason), TIMEOUT.toMillis() + 500, TimeUnit.MILLISECONDS)
                .exceptionally(ex -> Result.down(failureReason));
    }

    private static long elapsedMs(long startedNanos) {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedNanos);
    }
}
