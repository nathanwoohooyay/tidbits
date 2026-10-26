package com.tidbits.model.dto;

import java.time.LocalDateTime;

// `name` is the instrument's name when the stock is in the instruments table, otherwise null.
public record WatchlistItemDTO(
        String ticker,
        String name,
        LocalDateTime addedAt
) {
}
