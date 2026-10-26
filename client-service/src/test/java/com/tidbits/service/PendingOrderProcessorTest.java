package com.tidbits.service;

import com.tidbits.model.dto.PricingBatchResponseDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.InstrumentType;
import com.tidbits.model.enums.OrderExecution;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PendingOrderProcessorTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-26T15:00:00Z"), ZoneOffset.UTC);

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InstrumentRepository instrumentRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private PricingService pricingService;

    @Mock
    private MarketHoursService marketHours;

    private PendingOrderProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new PendingOrderProcessor(orderRepository, instrumentRepository, orderService, pricingService, marketHours, CLOCK);
    }

    @Test
    void expiresOldLimitOrdersEvenWhileTheMarketIsClosed() {
        Order expired = limitOrder(1, OrderType.BUY, "100", LocalDateTime.of(2026, 10, 26, 14, 0));
        Order live = limitOrder(2, OrderType.BUY, "100", LocalDateTime.of(2027, 1, 1, 0, 0));
        when(orderRepository.findByStatus(OrderStatus.PENDING)).thenReturn(List.of(expired, live));
        when(instrumentRepository.findAllById(List.of(2))).thenReturn(List.of(instrument()));
        when(marketHours.isOpenFor(InstrumentType.equity)).thenReturn(false);

        processor.processPendingOrders();

        verify(orderService).expireOrder(1);
        verify(orderService, never()).expireOrder(2);
        verify(orderService, never()).fillPendingOrder(anyInt());
        verifyNoInteractions(pricingService);
    }

    @Test
    void fillsQueuedMarketOrdersOnceOpen() {
        Order queued = new Order(3, 1, 2, new BigDecimal("1"), null, OrderType.BUY, OrderStatus.PENDING);
        queued.setExecutionType(OrderExecution.MARKET);
        when(orderRepository.findByStatus(OrderStatus.PENDING)).thenReturn(List.of(queued));
        when(instrumentRepository.findAllById(List.of(2))).thenReturn(List.of(instrument()));
        when(marketHours.isOpenFor(InstrumentType.equity)).thenReturn(true);

        processor.processPendingOrders();

        verify(orderService).fillPendingOrder(3);
        verifyNoInteractions(pricingService);
    }

    @Test
    void sendsOnlyLimitOrdersWhoseStoredPriceHasReachedTheLimit() {
        Order buyBelow = limitOrder(4, OrderType.BUY, "100", null);
        Order buyAbove = limitOrder(5, OrderType.BUY, "90", null);
        Order sellAbove = limitOrder(6, OrderType.SELL, "95", null);
        when(orderRepository.findByStatus(OrderStatus.PENDING)).thenReturn(List.of(buyBelow, buyAbove, sellAbove));
        when(marketHours.isOpenFor(InstrumentType.equity)).thenReturn(true);
        when(instrumentRepository.findAllById(List.of(2))).thenReturn(List.of(instrument()));
        when(pricingService.getBatchQuotes(anyList(), anyBoolean())).thenReturn(new PricingBatchResponseDTO(null, List.of(
                new PricingQuoteDTO(2, "AAPL", 96.0, null, null, null, null, null, "USD", null, false, "database", null, null))));

        processor.processPendingOrders();

        verify(orderService).fillPendingOrder(4);
        verify(orderService, never()).fillPendingOrder(5);
        verify(orderService).fillPendingOrder(6);
    }

    @Test
    void keepsGoingWhenOneOrderFails() {
        Order first = new Order(7, 1, 2, new BigDecimal("1"), null, OrderType.BUY, OrderStatus.PENDING);
        Order second = new Order(8, 1, 2, new BigDecimal("1"), null, OrderType.BUY, OrderStatus.PENDING);
        when(orderRepository.findByStatus(OrderStatus.PENDING)).thenReturn(List.of(first, second));
        when(instrumentRepository.findAllById(List.of(2))).thenReturn(List.of(instrument()));
        when(marketHours.isOpenFor(InstrumentType.equity)).thenReturn(true);
        when(orderService.fillPendingOrder(7)).thenThrow(new RuntimeException("quote failed"));

        processor.processPendingOrders();

        verify(orderService).fillPendingOrder(8);
    }

    @Test
    void cryptoOrdersFillWhileTheStockMarketIsClosed() {
        Order stock = new Order(20, 1, 2, new BigDecimal("1"), null, OrderType.BUY, OrderStatus.PENDING);
        Order coin = new Order(21, 1, 9, new BigDecimal("0.5"), null, OrderType.BUY, OrderStatus.PENDING);
        Instrument btc = new Instrument();
        btc.setInstrumentId(9);
        btc.setTicker("BTC");
        btc.setType(InstrumentType.crypto);
        when(orderRepository.findByStatus(OrderStatus.PENDING)).thenReturn(List.of(stock, coin));
        when(instrumentRepository.findAllById(List.of(2, 9))).thenReturn(List.of(instrument(), btc));
        when(marketHours.isOpenFor(InstrumentType.equity)).thenReturn(false);
        when(marketHours.isOpenFor(InstrumentType.crypto)).thenReturn(true);

        processor.processPendingOrders();

        verify(orderService).fillPendingOrder(21);
        verify(orderService, never()).fillPendingOrder(20);
    }

    private static Order limitOrder(int id, OrderType side, String limit, LocalDateTime expiresAt) {
        Order order = new Order(id, 1, 2, new BigDecimal("1"), null, side, OrderStatus.PENDING);
        order.setExecutionType(OrderExecution.LIMIT);
        order.setLimitPrice(new BigDecimal(limit));
        order.setExpiresAt(expiresAt);
        return order;
    }

    private static Instrument instrument() {
        Instrument instrument = new Instrument();
        instrument.setInstrumentId(2);
        instrument.setTicker("AAPL");
        instrument.setType(InstrumentType.equity);
        return instrument;
    }
}
