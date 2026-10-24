package com.tidbits.model.dto;

/**
 * Leave instrumentId null for a mystery drop: a random equity is picked server-side.
 */
public record StockDropRequestDTO(Integer accountId, Integer points, Integer instrumentId) {
}
