package com.tidbits.model.dto;

import java.util.List;

public record PricingCandlesResponseDTO(
        String symbol,
        String interval,
        String currency,
        String asOf,
        String source,
        Boolean partial,
        String availableFrom,
        List<PricingCandleDTO> candles
) {
}