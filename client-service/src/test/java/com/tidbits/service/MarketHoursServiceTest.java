package com.tidbits.service;

import com.tidbits.model.enums.InstrumentType;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MarketHoursServiceTest {

    // New York is UTC-4 until Nov 1 2026, then UTC-5.
    private static MarketHoursService at(String utc) {
        return new MarketHoursService(Clock.fixed(Instant.parse(utc), ZoneOffset.UTC));
    }

    @Test
    void openDuringTheRegularSession() {
        assertFalse(at("2026-10-26T13:29:59Z").isOpen());
        assertTrue(at("2026-10-26T13:30:00Z").isOpen());
        assertTrue(at("2026-10-26T19:59:59Z").isOpen());
        assertFalse(at("2026-10-26T20:00:00Z").isOpen());
    }

    @Test
    void followsDaylightSavingTime() {
        // Monday Nov 2 2026, after clocks go back: 9:30 New York is 14:30 UTC.
        assertFalse(at("2026-11-02T14:29:00Z").isOpen());
        assertTrue(at("2026-11-02T14:30:00Z").isOpen());
    }

    @Test
    void closedOnWeekendsAndHolidays() {
        assertFalse(at("2026-10-24T15:00:00Z").isOpen()); // Saturday
        assertFalse(at("2026-11-26T15:00:00Z").isOpen()); // Thanksgiving
        assertFalse(at("2027-07-05T15:00:00Z").isOpen()); // Independence Day, observed
    }

    @Test
    void closesAtOnePmOnEarlyCloseDays() {
        MarketHoursService service = at("2026-11-27T17:59:00Z");
        assertTrue(service.isOpen());
        assertFalse(at("2026-11-27T18:00:00Z").isOpen());
        assertEquals(LocalTime.of(13, 0), service.closeTime(LocalDate.of(2026, 11, 27)));
    }

    @Test
    void statusWhileClosedPointsAtTheNextSession() {
        // Friday evening -> Monday's open and close.
        MarketHoursService.MarketStatus status = at("2026-10-23T22:00:00Z").status();

        assertFalse(status.open());
        assertEquals(Instant.parse("2026-10-26T13:30:00Z"), status.nextOpen());
        assertEquals(Instant.parse("2026-10-26T20:00:00Z"), status.nextClose());
    }

    @Test
    void statusWhileOpenGivesTodaysCloseAndTomorrowsOpen() {
        MarketHoursService.MarketStatus status = at("2026-10-26T15:00:00Z").status();

        assertTrue(status.open());
        assertEquals(Instant.parse("2026-10-26T20:00:00Z"), status.nextClose());
        assertEquals(Instant.parse("2026-10-27T13:30:00Z"), status.nextOpen());
    }

    @Test
    void nextOpenSkipsHolidays() {
        // Wednesday before Thanksgiving, after the close -> Friday Nov 27.
        assertEquals(Instant.parse("2026-11-27T14:30:00Z"), at("2026-11-25T22:00:00Z").status().nextOpen());
    }

    @Test
    void cryptoIsAlwaysOpenWhileStocksAndEtfsFollowTheSession() {
        MarketHoursService saturday = at("2026-10-24T15:00:00Z");
        assertTrue(saturday.isOpenFor(InstrumentType.crypto));
        assertFalse(saturday.isOpenFor(InstrumentType.equity));
        assertFalse(saturday.isOpenFor(InstrumentType.etf));
        assertTrue(at("2026-10-26T15:00:00Z").isOpenFor(InstrumentType.etf));
    }

    @Test
    void beforeTheOpenOnATradingDayTheNextOpenIsToday() {
        assertEquals(Instant.parse("2026-10-26T13:30:00Z"), at("2026-10-26T11:00:00Z").status().nextOpen());
    }
}
