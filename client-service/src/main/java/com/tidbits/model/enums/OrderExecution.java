package com.tidbits.model.enums;

// How an order is priced: MARKET fills at the current price (at the next open if the market is closed);
// LIMIT fills only once the price reaches the limit (at or below it for a buy, at or above it for a sell).
public enum OrderExecution {
    MARKET,
    LIMIT
}
