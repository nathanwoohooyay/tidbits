package com.tidbits.service;

import com.tidbits.model.enums.InstrumentType;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Set;

// US equity regular trading session: 9:30am-4:00pm New York time on weekdays, closed on NYSE holidays and closing at
// 1:00pm on early-close days. The holiday calendar is published a year or more ahead; extend the lists below each year.
// Crypto trades around the clock; stocks and ETFs follow the session.
@Service
public class MarketHoursService {

    public static final ZoneId MARKET_ZONE = ZoneId.of("America/New_York");
    private static final LocalTime OPEN = LocalTime.of(9, 30);
    private static final LocalTime CLOSE = LocalTime.of(16, 0);
    private static final LocalTime EARLY_CLOSE = LocalTime.of(13, 0);

    private static final Set<LocalDate> HOLIDAYS = Set.of(
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 19), LocalDate.of(2026, 2, 16), LocalDate.of(2026, 4, 3),
            LocalDate.of(2026, 5, 25), LocalDate.of(2026, 6, 19), LocalDate.of(2026, 7, 3), LocalDate.of(2026, 9, 7),
            LocalDate.of(2026, 11, 26), LocalDate.of(2026, 12, 25),
            LocalDate.of(2027, 1, 1), LocalDate.of(2027, 1, 18), LocalDate.of(2027, 2, 15), LocalDate.of(2027, 3, 26),
            LocalDate.of(2027, 5, 31), LocalDate.of(2027, 6, 18), LocalDate.of(2027, 7, 5), LocalDate.of(2027, 9, 6),
            LocalDate.of(2027, 11, 25), LocalDate.of(2027, 12, 24)
    );

    private static final Set<LocalDate> EARLY_CLOSES = Set.of(
            LocalDate.of(2026, 11, 27), LocalDate.of(2026, 12, 24),
            LocalDate.of(2027, 11, 26)
    );

    private final Clock clock;

    public MarketHoursService(Clock clock) {
        this.clock = clock;
    }

    public record MarketStatus(boolean open, Instant nextOpen, Instant nextClose) {
    }

    public Instant now() {
        return clock.instant();
    }

    public boolean isOpen() {
        return isOpen(clock.instant());
    }

    public boolean isOpenFor(InstrumentType type) {
        return type == InstrumentType.crypto || isOpen();
    }

    public boolean isOpen(Instant instant) {
        ZonedDateTime at = instant.atZone(MARKET_ZONE);
        LocalDate day = at.toLocalDate();
        if (!isTradingDay(day)) {
            return false;
        }
        LocalTime time = at.toLocalTime();
        return !time.isBefore(OPEN) && time.isBefore(closeTime(day));
    }

    public boolean isTradingDay(LocalDate day) {
        DayOfWeek dow = day.getDayOfWeek();
        return dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY && !HOLIDAYS.contains(day);
    }

    public LocalTime closeTime(LocalDate day) {
        return EARLY_CLOSES.contains(day) ? EARLY_CLOSE : CLOSE;
    }

    // While open: the next open is the following session's. While closed: the next close is that session's close.
    public MarketStatus status() {
        Instant now = clock.instant();
        boolean open = isOpen(now);
        Instant nextOpen = nextOpenAfter(now);
        LocalDate closeDay = open ? now.atZone(MARKET_ZONE).toLocalDate() : nextOpen.atZone(MARKET_ZONE).toLocalDate();
        Instant nextClose = closeDay.atTime(closeTime(closeDay)).atZone(MARKET_ZONE).toInstant();
        return new MarketStatus(open, nextOpen, nextClose);
    }

    public Instant nextOpenAfter(Instant instant) {
        ZonedDateTime at = instant.atZone(MARKET_ZONE);
        LocalDate day = at.toLocalDate();
        if (isTradingDay(day) && at.toLocalTime().isBefore(OPEN)) {
            return day.atTime(OPEN).atZone(MARKET_ZONE).toInstant();
        }
        do {
            day = day.plusDays(1);
        } while (!isTradingDay(day));
        return day.atTime(OPEN).atZone(MARKET_ZONE).toInstant();
    }
}
