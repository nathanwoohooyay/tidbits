package com.tidbits.model.dto;

public record PricingQuoteDTO(
        String symbol,
        Double price,
        String currency,
        String asOf,
        boolean stale,
        String source,
        String errorCode,
        String errorMessage
) {
}
