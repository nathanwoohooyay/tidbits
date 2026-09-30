package com.tidbits.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PricingQuoteDTO(
        String symbol,
        Double price,
        String currency,
        String asOf,
        Boolean stale,
        String source,
        String errorCode,
        String errorMessage
) {
}
