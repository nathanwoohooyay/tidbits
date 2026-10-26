package com.tidbits.service;

import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.OrderRepository;
import com.tidbits.util.Money;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

// Works through orders waiting to fill. Expired limit orders are cancelled at any time. While an order's market is
// open (always, for crypto), market orders queued while it was closed fill at the live price, and limit orders whose
// instrument has reached the limit are sent to fill. Limit checks use stored quotes (refreshed at most every few minutes) so idle orders cost no API calls; only
// an order that looks triggered fetches a live price, and it fills only if that price still meets its limit.
@Component
public class PendingOrderProcessor {

    private static final Logger log = LoggerFactory.getLogger(PendingOrderProcessor.class);
    private static final int QUOTE_BATCH_SIZE = 25;

    private final OrderRepository orderRepository;
    private final InstrumentRepository instrumentRepository;
    private final OrderService orderService;
    private final PricingService pricingService;
    private final MarketHoursService marketHours;
    private final Clock clock;

    public PendingOrderProcessor(OrderRepository orderRepository, InstrumentRepository instrumentRepository,
                                 OrderService orderService, PricingService pricingService, MarketHoursService marketHours,
                                 Clock clock) {
        this.orderRepository = orderRepository;
        this.instrumentRepository = instrumentRepository;
        this.orderService = orderService;
        this.pricingService = pricingService;
        this.marketHours = marketHours;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${orders.pending.check-interval-ms:30000}", initialDelayString = "${orders.pending.initial-delay-ms:20000}")
    public void processPendingOrders() {
        List<Order> pending = orderRepository.findByStatus(OrderStatus.PENDING);
        if (pending.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now(clock);
        List<Order> live = new ArrayList<>();
        for (Order order : pending) {
            if (order.isLimit() && order.getExpiresAt() != null && now.isAfter(order.getExpiresAt())) {
                run(order, () -> orderService.expireOrder(order.getOrderId()));
            } else {
                live.add(order);
            }
        }

        if (live.isEmpty()) {
            return;
        }

        // Each order waits for its own market: crypto is always open, stocks and ETFs only during the session.
        Map<Integer, Instrument> instruments = instrumentRepository
                .findAllById(live.stream().map(Order::getInstrumentId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Instrument::getInstrumentId, Function.identity()));

        List<Order> limitOrders = new ArrayList<>();
        for (Order order : live) {
            Instrument instrument = instruments.get(order.getInstrumentId());
            if (instrument == null || !marketHours.isOpenFor(instrument.getType())) {
                continue;
            }
            if (order.isLimit()) {
                limitOrders.add(order);
            } else {
                run(order, () -> orderService.fillPendingOrder(order.getOrderId()));
            }
        }
        if (limitOrders.isEmpty()) {
            return;
        }

        Map<String, BigDecimal> prices = latestPrices(limitOrders.stream()
                .map(order -> instruments.get(order.getInstrumentId()).getTicker())
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        for (Order order : limitOrders) {
            String ticker = instruments.get(order.getInstrumentId()).getTicker();
            BigDecimal price = ticker == null ? null : prices.get(ticker.toUpperCase(Locale.ROOT));
            if (OrderService.limitReached(order, price)) {
                run(order, () -> orderService.fillPendingOrder(order.getOrderId()));
            }
        }
    }

    private Map<String, BigDecimal> latestPrices(List<String> tickers) {
        Map<String, BigDecimal> prices = new HashMap<>();
        for (int i = 0; i < tickers.size(); i += QUOTE_BATCH_SIZE) {
            List<String> batch = new ArrayList<>(tickers.subList(i, Math.min(i + QUOTE_BATCH_SIZE, tickers.size())));
            try {
                for (PricingQuoteDTO quote : pricingService.getBatchQuotes(batch, false).quotes()) {
                    if (quote.symbol() != null && quote.price() != null) {
                        prices.put(quote.symbol().toUpperCase(Locale.ROOT), Money.of(quote.price()));
                    }
                }
            } catch (RuntimeException ex) {
                log.warn("Could not fetch quotes for pending limit orders", ex);
            }
        }
        return prices;
    }

    // One order failing (a quote error, say) shouldn't hold up the rest; it's retried on the next run.
    private void run(Order order, Runnable action) {
        try {
            action.run();
        } catch (RuntimeException ex) {
            log.warn("Could not process pending order {}", order.getOrderId(), ex);
        }
    }
}
