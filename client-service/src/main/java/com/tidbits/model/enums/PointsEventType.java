package com.tidbits.model.enums;

public enum PointsEventType {
    EARN_TRADE,
    CASH_OUT,
    /** Retired; kept so existing ledger rows still load. */
    STOCK_DROP,
    /** Retired; kept so existing ledger rows still load. */
    STOCK_PACK,
    LOTTERY_TICKET,
    LOTTERY_WIN,
    SCRATCH_CARD,
    SCRATCH_WIN
}
