package com.tidbits.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

// Money is kept as BigDecimal: cash to the cent, prices to 8 decimal places (a coin can trade below a cent), and
// quantities to 4 decimal places.
// Amounts charged or credited round down to the cent, so the account never pays more than the quoted value.
public final class Money {

    public static final int CENT_SCALE = 2;
    public static final int SHARE_SCALE = 4;
    public static final int PRICE_SCALE = 8;

    private Money() {
    }

    public static BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public static BigDecimal floorCents(BigDecimal value) {
        return value.setScale(CENT_SCALE, RoundingMode.FLOOR);
    }

    public static BigDecimal cents(BigDecimal value) {
        return value.setScale(CENT_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal price(BigDecimal value) {
        return value.setScale(PRICE_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal shares(BigDecimal value) {
        return value.setScale(SHARE_SCALE, RoundingMode.FLOOR);
    }

    // Market data arrives as doubles; BigDecimal.valueOf keeps the value as printed (0.1, not 0.1000000000000000055...).
    public static BigDecimal of(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }

    public static boolean isPositive(BigDecimal value) {
        return value != null && value.signum() > 0;
    }
}
