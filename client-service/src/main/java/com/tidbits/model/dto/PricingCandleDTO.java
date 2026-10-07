package com.tidbits.model.dto;

public record PricingCandleDTO(
        String date,
        Double open,
        Double high,
        Double low,
        Double close,
        Double adjclose,
        Long volume,
        boolean synthetic
) {
}