package com.tidbits.model.dto;

import java.util.List;

public record PricingBatchResponseDTO(
        String asOf,
        List<PricingQuoteDTO> quotes
) {
}
