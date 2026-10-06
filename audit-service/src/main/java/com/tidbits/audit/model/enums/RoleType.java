package com.tidbits.audit.model.enums;

import java.util.Locale;

public enum RoleType {
    CLIENT,
    AUDITOR,
    REPORTER,
    ADMIN;

    public static RoleType fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return RoleType.valueOf(normalized);
    }

    public String toDatabaseValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}
