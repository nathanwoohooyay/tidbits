package com.tidbits.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PricingQuoteDTO(
        Integer instrumentId,
        String symbol,
        Double price,
        Double change,
        Double bid,
        Double ask,
        Double changePercent,
        Double prevClose,
        String currency,
        String asOf,
        Boolean stale,
        String source,
        String errorCode,
        String errorMessage
) {
}
