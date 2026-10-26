package com.tidbits.service;

import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountHolding;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.PortfolioSnapshot;
import com.tidbits.repository.AccountHoldingRepository;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.PortfolioSnapshotRepository;
import com.tidbits.util.Money;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

// Records each account's value (cash plus positions at their latest stored price) for the portfolio charts: every hour
// while the market is open, once at the close, and right after anything that changes an account (trades, deposits,
// withdrawals).
@Service
public class PortfolioSnapshotRecorder {

    private static final Logger log = LoggerFactory.getLogger(PortfolioSnapshotRecorder.class);
    private static final int QUOTE_BATCH_SIZE = 25;

    private final AccountRepository accountRepository;
    private final AccountHoldingRepository accountHoldingRepository;
    private final InstrumentRepository instrumentRepository;
    private final PortfolioSnapshotRepository portfolioSnapshotRepository;
    private final PricingService pricingService;
    private final MarketHoursService marketHours;

    public PortfolioSnapshotRecorder(AccountRepository accountRepository, AccountHoldingRepository accountHoldingRepository,
                                     InstrumentRepository instrumentRepository,
                                     PortfolioSnapshotRepository portfolioSnapshotRepository, PricingService pricingService,
                                     MarketHoursService marketHours) {
        this.accountRepository = accountRepository;
        this.accountHoldingRepository = accountHoldingRepository;
        this.instrumentRepository = instrumentRepository;
        this.portfolioSnapshotRepository = portfolioSnapshotRepository;
        this.pricingService = pricingService;
        this.marketHours = marketHours;
    }

    // Runs on the hour from 10:00 to 16:00 New York time on weekdays; the 16:00 run is the close. Skips holidays, and
    // on early-close days the runs after the 13:00 close.
    @Scheduled(cron = "${portfolio.snapshot.cron:0 0 10-16 * * MON-FRI}", zone = "America/New_York")
    public void recordScheduled() {
        ZonedDateTime now = marketHours.now().atZone(MarketHoursService.MARKET_ZONE);
        if (!marketHours.isTradingDay(now.toLocalDate())
                || now.toLocalTime().truncatedTo(ChronoUnit.MINUTES).isAfter(marketHours.closeTime(now.toLocalDate()))) {
            return;
        }
        recordAll();
    }

    public void recordAll() {
        refreshHeldPrices();
        for (Account account : accountRepository.findAll()) {
            try {
                record(account);
            } catch (RuntimeException ex) {
                log.warn("Could not record a portfolio snapshot for account {}", account.getAccountId(), ex);
            }
        }
    }

    // Accounts worth nothing (no cash, no positions) aren't recorded: the table only holds positive values.
    public void record(Account account) {
        BigDecimal value = accountValue(account);
        if (value.signum() <= 0) {
            return;
        }
        portfolioSnapshotRepository.save(new PortfolioSnapshot(null, account.getAccountId().longValue(), value, LocalDateTime.now()));
    }

    // A position with no stored price yet counts at what was paid for it.
    public BigDecimal accountValue(Account account) {
        List<AccountHolding> holdings = accountHoldingRepository.findByAccountId(account.getAccountId());
        Map<Integer, Instrument> instruments = holdings.isEmpty() ? Map.of() : instrumentRepository
                .findAllById(holdings.stream().map(AccountHolding::getInstrumentId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Instrument::getInstrumentId, Function.identity()));

        BigDecimal total = Money.orZero(account.getCashBalance());
        for (AccountHolding holding : holdings) {
            Instrument instrument = instruments.get(holding.getInstrumentId());
            BigDecimal price = instrument == null ? null : Money.of(instrument.getLastPrice());
            total = total.add(price != null
                    ? Money.orZero(holding.getQuantity()).multiply(price)
                    : Money.orZero(holding.getAmountInvested()));
        }
        return Money.cents(total);
    }

    // Brings stored prices for everything anyone holds up to date (quotes younger than the quote cache are reused).
    // If Fauxnance is unavailable the snapshot uses the prices already stored.
    private void refreshHeldPrices() {
        List<Integer> instrumentIds = accountHoldingRepository.findAll().stream()
                .map(AccountHolding::getInstrumentId)
                .distinct()
                .toList();
        if (instrumentIds.isEmpty()) {
            return;
        }
        List<String> tickers = instrumentRepository.findAllById(instrumentIds).stream()
                .map(Instrument::getTicker)
                .filter(Objects::nonNull)
                .toList();
        for (int i = 0; i < tickers.size(); i += QUOTE_BATCH_SIZE) {
            List<String> batch = new ArrayList<>(tickers.subList(i, Math.min(i + QUOTE_BATCH_SIZE, tickers.size())));
            try {
                pricingService.getBatchQuotes(batch, false);
            } catch (RuntimeException ex) {
                log.warn("Could not refresh prices for portfolio snapshots; using stored prices", ex);
            }
        }
    }
}
