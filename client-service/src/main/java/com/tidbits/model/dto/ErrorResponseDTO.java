package com.tidbits.model.dto;

import java.time.Instant;

public record ErrorResponseDTO(
        Instant timestamp,
        String errorCode,
        String message,
        Integer status
) {

    public static ErrorResponseDTO of(String errorCode, String message, Integer status) {
        return new ErrorResponseDTO(Instant.now(), errorCode, message, status);
    }
}
