package com.tidbits.service;

import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaAdmin;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DependencyChecksTest {

    private final DataSource dataSource = mock(DataSource.class);
    // Nothing listens on port 1, so Kafka never answers.
    private final KafkaAdmin kafkaAdmin = new KafkaAdmin(Map.of("bootstrap.servers", "127.0.0.1:1"));
    private final DependencyChecks checks = new DependencyChecks(dataSource, kafkaAdmin);

    @Test
    void databaseIsUpWhenAConnectionAnswers() throws SQLException {
        Connection connection = mock(Connection.class);
        when(connection.isValid(anyInt())).thenReturn(true);
        when(dataSource.getConnection()).thenReturn(connection);

        DependencyChecks.Result result = checks.database().join();

        assertTrue(result.ok());
        assertNotNull(result.latencyMs());
    }

    @Test
    void databaseIsDownWhenNoConnectionCanBeMade() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("refused"));

        assertEquals(DependencyChecks.Result.down("Database unreachable"), checks.database().join());
    }

    @Test
    void aHungDatabaseIsReportedAfterTheTimeout() throws SQLException {
        when(dataSource.getConnection()).thenAnswer(invocation -> {
            Thread.sleep(10_000);
            return null;
        });
        long started = System.nanoTime();

        DependencyChecks.Result result = checks.database().join();

        assertEquals("Database not answering", result.reason());
        assertTrue((System.nanoTime() - started) / 1_000_000 < 5_000);
    }

    @Test
    void kafkaIsDownWhenNoBrokerAnswers() {
        assertEquals(DependencyChecks.Result.down("Kafka unreachable"), checks.kafka().join());
    }
}
