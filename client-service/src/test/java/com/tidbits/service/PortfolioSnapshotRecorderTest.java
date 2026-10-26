package com.tidbits.service;

import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountHolding;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.PortfolioSnapshot;
import com.tidbits.repository.AccountHoldingRepository;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.PortfolioSnapshotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortfolioSnapshotRecorderTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AccountHoldingRepository accountHoldingRepository;

    @Mock
    private InstrumentRepository instrumentRepository;

    @Mock
    private PortfolioSnapshotRepository portfolioSnapshotRepository;

    @Mock
    private PricingService pricingService;

    private PortfolioSnapshotRecorder recorder(String utc) {
        return new PortfolioSnapshotRecorder(accountRepository, accountHoldingRepository, instrumentRepository,
                portfolioSnapshotRepository, pricingService,
                new MarketHoursService(Clock.fixed(Instant.parse(utc), ZoneOffset.UTC)));
    }

    @Test
    void accountValue_isCashPlusPositionsAtStoredPrices() {
        Account account = account("100.50");
        when(accountHoldingRepository.findByAccountId(3)).thenReturn(List.of(
                holding(1, "2", "150"), holding(2, "0.5", "40")));
        when(instrumentRepository.findAllById(List.of(1, 2))).thenReturn(List.of(instrument(1, "AAPL", 101.255)));

        // 100.50 + 2 x 101.255 + (no price: cost basis) 40 = 343.01
        assertEquals(new BigDecimal("343.01"), recorder("2026-10-26T15:00:00Z").accountValue(account));
    }

    @Test
    void record_savesPositiveValuesOnly() {
        when(accountHoldingRepository.findByAccountId(3)).thenReturn(List.of());
        PortfolioSnapshotRecorder recorder = recorder("2026-10-26T15:00:00Z");

        recorder.record(account("0"));
        verify(portfolioSnapshotRepository, never()).save(any());

        recorder.record(account("25"));
        ArgumentCaptor<PortfolioSnapshot> saved = ArgumentCaptor.forClass(PortfolioSnapshot.class);
        verify(portfolioSnapshotRepository).save(saved.capture());
        assertEquals(3L, saved.getValue().getAccountId());
        assertEquals(new BigDecimal("25.00"), saved.getValue().getTotalValue());
    }

    @Test
    void recordScheduled_skipsWeekendsAndRunsAfterAnEarlyClose() {
        recorder("2026-10-24T15:00:00Z").recordScheduled(); // Saturday
        recorder("2026-11-27T19:00:00Z").recordScheduled(); // 14:00 on an early-close day

        verifyNoInteractions(accountRepository, pricingService);
    }

    @Test
    void recordScheduled_refreshesPricesThenRecordsEveryAccountAtTheClose() {
        Account account = account("10");
        when(accountHoldingRepository.findAll()).thenReturn(List.of(holding(1, "1", "5")));
        when(instrumentRepository.findAllById(List.of(1))).thenReturn(List.of(instrument(1, "AAPL", 20.0)));
        when(accountRepository.findAll()).thenReturn(List.of(account));
        when(accountHoldingRepository.findByAccountId(3)).thenReturn(List.of(holding(1, "1", "5")));

        recorder("2026-10-26T20:00:30Z").recordScheduled(); // 16:00:30 New York

        verify(pricingService).getBatchQuotes(anyList(), anyBoolean());
        ArgumentCaptor<PortfolioSnapshot> saved = ArgumentCaptor.forClass(PortfolioSnapshot.class);
        verify(portfolioSnapshotRepository).save(saved.capture());
        assertEquals(new BigDecimal("30.00"), saved.getValue().getTotalValue());
    }

    @Test
    void recordAll_usesStoredPricesWhenQuotesFail() {
        Account account = account("10");
        when(accountHoldingRepository.findAll()).thenReturn(List.of(holding(1, "1", "5")));
        when(instrumentRepository.findAllById(List.of(1))).thenReturn(List.of(instrument(1, "AAPL", 20.0)));
        when(pricingService.getBatchQuotes(anyList(), anyBoolean())).thenThrow(new RuntimeException("Fauxnance down"));
        when(accountRepository.findAll()).thenReturn(List.of(account));
        when(accountHoldingRepository.findByAccountId(3)).thenReturn(List.of(holding(1, "1", "5")));

        recorder("2026-10-26T15:00:00Z").recordAll();

        verify(portfolioSnapshotRepository).save(any(PortfolioSnapshot.class));
    }

    private static Account account(String cash) {
        return new Account(3, 7, "Main", new BigDecimal(cash), LocalDateTime.now());
    }

    private static AccountHolding holding(int instrumentId, String quantity, String invested) {
        return new AccountHolding(null, 3, instrumentId, new BigDecimal(quantity), new BigDecimal(invested), LocalDateTime.now());
    }

    private static Instrument instrument(int id, String ticker, double lastPrice) {
        Instrument instrument = new Instrument();
        instrument.setInstrumentId(id);
        instrument.setTicker(ticker);
        instrument.setLastPrice(lastPrice);
        return instrument;
    }
}
