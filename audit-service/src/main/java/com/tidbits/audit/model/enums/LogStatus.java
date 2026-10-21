package com.tidbits.audit.model.enums;

import java.util.Locale;

public enum LogStatus {
    SUCCESS,
    FAILURE;

    public static LogStatus fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "SUCCESS" -> SUCCESS;
            case "FAILURE", "REJECTED" -> FAILURE;
            default -> null;
        };
    }

    public String toDatabaseValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}
