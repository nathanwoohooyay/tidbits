package com.tidbits.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads environment variables from .env file before Spring initializes beans
 * This ensures datasource URL, username, password are available during bean creation
 */
@Component
public class EnvPropertySourcePostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> properties = new HashMap<>();

        // Try to load .env from project root
        try {
            String envFilePath = ".env";
            if (Files.exists(Paths.get(envFilePath))) {
                Files.lines(Paths.get(envFilePath))
                    .filter(line -> !line.startsWith("#") && !line.trim().isEmpty() && line.contains("="))
                    .forEach(line -> {
                        String[] parts = line.split("=", 2);
                        if (parts.length == 2) {
                            String key = parts[0].trim();
                            String value = parts[1].trim();
                            properties.put(key, value);
                        }
                    });
                
                // Add to Spring environment
                if (!properties.isEmpty()) {
                    environment.getPropertySources()
                        .addFirst(new MapPropertySource("env-file", properties));
                }
            }
        } catch (IOException e) {
            // .env file not found - use system environment variables instead
            System.err.println("Warning: .env file not found. Using system environment variables.");
        }
    }
}
