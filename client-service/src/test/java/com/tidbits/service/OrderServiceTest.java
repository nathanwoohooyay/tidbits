package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.dto.OrderEventDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.model.entity.AccountHolding;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.InstrumentType;
import com.tidbits.model.enums.NotificationCategory;
import com.tidbits.model.enums.OrderExecution;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.model.enums.PointsEventType;
import com.tidbits.repository.AccountHoldingRepository;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.AccountTransactionRepository;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.OrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-26T15:00:00Z"), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("1", null));
        ReflectionTestUtils.setField(orderService, "clock", CLOCK);
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private AccountService accountService;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AccountHoldingRepository accountHoldingRepository;

    @Mock
    private AccountTransactionRepository accountTransactionRepository;

    @Mock
    private OrderStatusHistoryService orderStatusHistoryService;

    @Mock
    private InstrumentRepository instrumentRepository;

    @Mock
    private PricingService pricingService;

    @Mock
    private OrderEventPublisher orderEventPublisher;

    @Mock
    private PointsLedgerService pointsLedgerService;

    @Mock
    private MarketHoursService marketHours;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PortfolioSnapshotRecorder snapshotRecorder;

    @InjectMocks
    private OrderService orderService;

    @Test
    void requestOrder_throwsWhenOrderPayloadMissingRequiredFields() {
        Order order = order(1, 2, "10", "25", null, null);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.requestOrder(order));

        assertEquals("Account, instrument, and order type are required.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void requestOrder_setsPlacedStatusAndPublishesPlacementEvent() {
        Order order = order(1, 2, "10", "50", OrderType.BUY, null);
        Account account = account(1, "1000");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(marketHours.isOpenFor(InstrumentType.equity)).thenReturn(true);
        stubSaveAssigningId(99);

        Order placed = orderService.requestOrder(order);

        assertEquals(OrderStatus.PLACED, placed.getStatus());
        assertEquals(99, placed.getOrderId());
        assertEquals(OrderExecution.MARKET, placed.getExecutionType());
        assertNull(placed.getStockPrice());

        verify(orderStatusHistoryService).switchStatus(placed, null, OrderStatus.PLACED);
        verify(orderEventPublisher).publish(eq("ORDER_PLACED"), eq(placed), any());
    }

    @Test
    void requestOrder_queuesMarketOrderWhileClosedAndSetsAsideTheEstimatedCost() {
        Order order = order(1, 2, "3", null, OrderType.BUY, null);
        Account account = account(1, "1000");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(marketHours.isOpenFor(InstrumentType.equity)).thenReturn(false);
        stubQuote(100.0, 99.5, 100.004);
        when(orderRepository.sumReservedCash(1, 0)).thenReturn(BigDecimal.ZERO);
        stubSaveAssigningId(40);

        Order queued = orderService.requestOrder(order);

        assertEquals(OrderStatus.PENDING, queued.getStatus());
        assertEquals(bd("300.01"), queued.getReservedAmount());
        assertNull(queued.getExpiresAt());
        verify(orderEventPublisher).publish(eq("ORDER_PENDING"), eq(queued), any());
        verify(orderEventPublisher, never()).publish(eq("ORDER_PLACED"), any(), any());
    }

    @Test
    void requestOrder_limitBuyWaitsWithItsCostSetAsideAndExpiresAfter90Days() {
        Order order = limit(order(1, 2, "3", null, OrderType.BUY, null), "95.505");
        Account account = account(1, "1000");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(orderRepository.sumReservedCash(1, 0)).thenReturn(bd("500.00"));
        stubSaveAssigningId(41);

        Order pending = orderService.requestOrder(order);

        assertEquals(OrderStatus.PENDING, pending.getStatus());
        assertEquals(bd("95.50500000"), pending.getLimitPrice());
        // 3 x $95.505 = $286.515, set aside as $286.51 (what a fill at the limit would be charged).
        assertEquals(bd("286.51"), pending.getReservedAmount());
        assertEquals(LocalDateTime.of(2027, 1, 24, 15, 0), pending.getExpiresAt());
        verify(pricingService, never()).getRequestedQuotes(anyList(), anyMap());
    }

    @Test
    void requestOrder_cryptoMarketOrderFillsStraightAwayAroundTheClock() {
        Order order = order(1, 9, "0.25", null, OrderType.BUY, null);
        Instrument btc = instrument(9);
        btc.setTicker("BTC");
        btc.setType(InstrumentType.crypto);

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "30000")));
        when(instrumentRepository.findById(9)).thenReturn(Optional.of(btc));
        when(marketHours.isOpenFor(InstrumentType.crypto)).thenReturn(true);
        stubSaveAssigningId(60);

        Order placed = orderService.requestOrder(order);

        assertEquals(OrderStatus.PLACED, placed.getStatus());
        verify(orderEventPublisher).publish(eq("ORDER_PLACED"), eq(placed), any());
    }

    @Test
    void requestOrder_keepsSubCentLimitPrices() {
        Order order = limit(order(1, 9, "1000", null, OrderType.BUY, null), "0.0775");
        Instrument doge = instrument(9);
        doge.setTicker("DOGE");
        doge.setType(InstrumentType.crypto);

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "1000")));
        when(instrumentRepository.findById(9)).thenReturn(Optional.of(doge));
        when(orderRepository.sumReservedCash(1, 0)).thenReturn(BigDecimal.ZERO);
        stubSaveAssigningId(61);

        Order pending = orderService.requestOrder(order);

        assertEquals(bd("0.07750000"), pending.getLimitPrice());
        assertEquals(bd("77.50"), pending.getReservedAmount());
    }

    @Test
    void requestOrder_limitBuyRejectedWhenCashIsAlreadySetAside() {
        Order order = limit(order(1, 2, "3", null, OrderType.BUY, null), "100");
        Account account = account(1, "1000");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(orderRepository.sumReservedCash(1, 0)).thenReturn(bd("800.00"));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.requestOrder(order));

        assertEquals("Not enough buying power: this order needs $300.00 and $200.00 is available.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void requestOrder_limitSellRejectedWhenSharesArePromisedToOtherSells() {
        Order order = limit(order(1, 2, "3", null, OrderType.SELL, null), "120");
        Account account = account(1, "0");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(1, 2)).thenReturn(Optional.of(holding("5", "500")));
        when(orderRepository.sumReservedShares(1, 2, 0)).thenReturn(bd("4"));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.requestOrder(order));

        assertEquals("You can sell up to 1 shares of AAPL (the rest are already in open sell orders).", ex.getMessage());
    }

    @Test
    void requestOrder_limitOrderNeedsAPositiveLimitPrice() {
        Order order = limit(order(1, 2, "3", null, OrderType.BUY, null), "0");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.requestOrder(order));

        assertEquals("A limit order needs a limit price greater than zero.", ex.getMessage());
    }

    @Test
    void requestOrder_throwsWhenInstrumentMissing() {
        Order order = order(1, 2, "5", "100", OrderType.SELL, null);
        Account account = account(1, "1000");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> orderService.requestOrder(order));

        assertEquals("Instrument 2 not found.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void requestOrder_throwsWhenAuthenticatedUserDoesNotOwnAccount() {
        Order order = order(1, 2, "2", "1", OrderType.SELL, null);
        Account account = account(1, "1000");
        account.setUserId(77);

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> orderService.requestOrder(order));

        assertEquals("Authenticated user does not own account 1.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void fillOrder_throwsWhenOrderEventMissingRequiredFields() {
        OrderEventDTO orderEvent = event(3, 2, "1", null);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.fillOrder(orderEvent));

        assertEquals("Order event must include order, account, instrument, and order type.", ex.getMessage());
    }

    @Test
    void fillOrder_updatesOrderStatusThroughAcceptedAndFilledTransitions() {
        Order order = order(1, 2, "1", "10", OrderType.BUY, OrderStatus.PLACED);
        order.setOrderId(3);
        Account account = account(1, "1000");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(orderRepository.findById(3)).thenReturn(Optional.of(order));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(100.0, 99.5, 100.0);
        when(orderStatusHistoryService.getHistoryByOrderId(3)).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.fillOrder(event(3, 2, "1", "BUY"));

        assertEquals(OrderStatus.FILLED, updated.getStatus());
        assertEquals(bd("900.00"), account.getCashBalance());
        verify(pointsLedgerService).record(eq(1), eq(PointsEventType.EARN_TRADE), eq(100), any());
        verify(orderStatusHistoryService).switchStatus(updated, OrderStatus.PLACED, OrderStatus.ACCEPTED);
        verify(orderStatusHistoryService).switchStatus(updated, OrderStatus.ACCEPTED, OrderStatus.FILLED);
        verify(orderEventPublisher).publish(eq("ORDER_ACCEPTED"), eq(updated), any(), any());
        verify(orderEventPublisher).publish(eq("ORDER_FILLED"), eq(updated), any(), any());
        verify(notificationService).notify(eq(1), eq(NotificationCategory.ORDER), eq("Bought 1 AAPL"),
                eq("$100.00 at $100.00 · Main"), any());
        verify(snapshotRecorder).record(account);
    }

    @Test
    void fillOrder_ignoresAnOrderThatAlreadyFilled() {
        Order order = order(1, 2, "1", "10", OrderType.BUY, OrderStatus.FILLED);
        order.setOrderId(3);

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "1000")));
        when(orderRepository.findById(3)).thenReturn(Optional.of(order));

        orderService.fillOrder(event(3, 2, "1", "BUY"));

        verify(pricingService, never()).getRequestedQuotes(anyList(), anyMap());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void fillOrder_awardsOnlyWholeDollarsAndAccumulatesPoints() {
        Order order = order(1, 2, "3", "10", OrderType.BUY, OrderStatus.PLACED);
        order.setOrderId(30);
        Account account = account(1, "1000");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(orderRepository.findById(30)).thenReturn(Optional.of(order));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(100.0, 100.1666667, 100.1666667);
        when(orderStatusHistoryService.getHistoryByOrderId(30)).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.fillOrder(event(30, 2, "3", "BUY"));

        // 3 x $100.17 = $300.51
        verify(pointsLedgerService).record(eq(1), eq(PointsEventType.EARN_TRADE), eq(300), any());
    }

    @Test
    void fillOrder_floorsBuyTotalToTheCent() {
        Order order = order(1, 2, "3", "10", OrderType.BUY, OrderStatus.PLACED);
        order.setOrderId(4);
        Account account = account(1, "100.01");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(orderRepository.findById(4)).thenReturn(Optional.of(order));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(33.336, 33.0, 33.336);
        when(orderStatusHistoryService.getHistoryByOrderId(4)).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(1, 2)).thenReturn(Optional.empty());
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.fillOrder(event(4, 2, "3", "BUY"));

        // 3 x $33.336 = $100.008, charged as $100.00.
        assertEquals(OrderStatus.FILLED, updated.getStatus());
        assertEquals(bd("0.01"), account.getCashBalance());
    }

    @Test
    void fillOrder_buyRespectsCashSetAsideByOtherOrders() {
        Order order = order(1, 2, "1", "10", OrderType.BUY, OrderStatus.PLACED);
        order.setOrderId(6);
        Account account = account(1, "150");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(orderRepository.findById(6)).thenReturn(Optional.of(order));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(100.0, 99.5, 100.0);
        when(orderRepository.sumReservedCash(1, 6)).thenReturn(bd("60.00"));
        when(orderStatusHistoryService.getHistoryByOrderId(6)).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.fillOrder(event(6, 2, "1", "BUY"));

        assertEquals(OrderStatus.REJECTED, updated.getStatus());
        assertEquals(bd("150"), account.getCashBalance());
        verify(notificationService).notify(eq(1), eq(NotificationCategory.ORDER), eq("Order rejected: buy of 1 AAPL"),
                eq("There wasn't enough cash in Main to cover $100.00."), any());
        verify(snapshotRecorder, never()).record(any());
    }

    @Test
    void fillOrder_sellCreditsProceedsAndShrinksCostBasis() {
        Order order = order(1, 2, "2", "10", OrderType.SELL, OrderStatus.PLACED);
        order.setOrderId(5);
        Account account = account(1, "10.01");
        AccountHolding holding = holding("3", "50");

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(orderRepository.findById(5)).thenReturn(Optional.of(order));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(33.5, 33.336, 33.5);
        when(orderStatusHistoryService.getHistoryByOrderId(5)).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(1, 2)).thenReturn(Optional.of(holding));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.fillOrder(event(5, 2, "2", "SELL"));

        assertEquals(OrderStatus.FILLED, updated.getStatus());
        // 2 x $33.336 = $66.672, credited as $66.67.
        assertEquals(bd("76.68"), account.getCashBalance());
        assertEquals(bd("1"), holding.getQuantity());
        assertEquals(bd("16.67"), holding.getAmountInvested());
    }

    @Test
    void fillPendingOrder_limitBuyWaitsWhileThePriceIsAboveTheLimit() {
        Order order = pendingLimit(OrderType.BUY, "2", "95", "190.00");

        when(orderRepository.findById(50)).thenReturn(Optional.of(order));
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "1000")));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(95.2, 95.1, 95.2);

        assertFalse(orderService.fillPendingOrder(50));

        assertEquals(OrderStatus.PENDING, order.getStatus());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void fillPendingOrder_limitBuyFillsAtTheAskOnceItReachesTheLimit() {
        Order order = pendingLimit(OrderType.BUY, "2", "95", "190.00");
        Account account = account(1, "1000");

        when(orderRepository.findById(50)).thenReturn(Optional.of(order));
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(94.8, 94.7, 94.8);
        when(orderRepository.sumReservedCash(1, 50)).thenReturn(BigDecimal.ZERO);
        when(orderStatusHistoryService.getHistoryByOrderId(50)).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertTrue(orderService.fillPendingOrder(50));

        assertEquals(OrderStatus.FILLED, order.getStatus());
        assertEquals(bd("94.8"), order.getStockPrice());
        assertEquals(bd("810.40"), account.getCashBalance());
        assertNull(order.getReservedAmount());
        verify(orderStatusHistoryService).switchStatus(order, OrderStatus.PENDING, OrderStatus.ACCEPTED);
        verify(notificationService).notify(eq(1), eq(NotificationCategory.ORDER), eq("Bought 2 AAPL"),
                eq("$189.60 at $94.80 (limit $95.00) · Main"), any());
    }

    @Test
    void fillPendingOrder_limitSellFillsOnlyAtOrAboveTheLimit() {
        Order order = pendingLimit(OrderType.SELL, "1", "120", null);

        when(orderRepository.findById(50)).thenReturn(Optional.of(order));
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "0")));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(119.99, 119.99, 120.1);

        assertFalse(orderService.fillPendingOrder(50));
        assertEquals(OrderStatus.PENDING, order.getStatus());
    }

    @Test
    void fillPendingOrder_queuedMarketOrderFillsAtTheOpen() {
        Order order = order(1, 2, "1", null, OrderType.BUY, OrderStatus.PENDING);
        order.setOrderId(51);
        order.setExecutionType(OrderExecution.MARKET);
        order.setReservedAmount(bd("100.00"));
        Account account = account(1, "1000");

        when(orderRepository.findById(51)).thenReturn(Optional.of(order));
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        stubQuote(104.0, 103.9, 104.0);
        when(orderRepository.sumReservedCash(1, 51)).thenReturn(BigDecimal.ZERO);
        when(orderStatusHistoryService.getHistoryByOrderId(51)).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertTrue(orderService.fillPendingOrder(51));

        assertEquals(OrderStatus.FILLED, order.getStatus());
        assertEquals(bd("896.00"), account.getCashBalance());
        verify(notificationService).notify(eq(1), eq(NotificationCategory.ORDER), eq("Bought 1 AAPL at the open"), anyString(), any());
    }

    @Test
    void fillPendingOrder_skipsOrdersNoLongerPending() {
        Order order = pendingLimit(OrderType.BUY, "2", "95", "190.00");
        order.setStatus(OrderStatus.CANCELED);
        when(orderRepository.findById(50)).thenReturn(Optional.of(order));

        assertFalse(orderService.fillPendingOrder(50));
        verify(pricingService, never()).getRequestedQuotes(anyList(), anyMap());
    }

    @Test
    void cancelOrder_cancelsAPendingOrderAndReleasesItsCash() {
        Order order = pendingLimit(OrderType.BUY, "2", "95", "190.00");
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "1000")));
        when(orderRepository.findById(50)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderStatusHistoryService.getHistoryByOrderId(50)).thenReturn(List.of());
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));

        Order cancelled = orderService.cancelOrder(1, 50);

        assertEquals(OrderStatus.CANCELED, cancelled.getStatus());
        assertNull(cancelled.getReservedAmount());
        verify(orderEventPublisher).publish(eq("ORDER_CANCELED"), eq(cancelled), any());
        verify(orderStatusHistoryService).switchStatus(cancelled, OrderStatus.PENDING, OrderStatus.CANCELED);
        verify(notificationService).notify(eq(1), eq(NotificationCategory.ORDER), eq("Cancelled limit buy of 2 AAPL"),
                eq("Limit $95.00 · Main"), any());
    }

    @Test
    void cancelOrder_refusesOrdersThatAlreadyFilled() {
        Order order = order(1, 2, "1", "10", OrderType.BUY, OrderStatus.FILLED);
        order.setOrderId(52);
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "1000")));
        when(orderRepository.findById(52)).thenReturn(Optional.of(order));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.cancelOrder(1, 52));

        assertEquals("Only orders that haven't filled yet can be cancelled.", ex.getMessage());
    }

    @Test
    void expireOrder_cancelsAndNotifies() {
        Order order = pendingLimit(OrderType.BUY, "2", "95", "190.00");
        when(orderRepository.findById(50)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderStatusHistoryService.getHistoryByOrderId(50)).thenReturn(List.of());
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, "1000")));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));

        orderService.expireOrder(50);

        assertEquals(OrderStatus.CANCELED, order.getStatus());
        verify(orderEventPublisher).publish(eq("ORDER_EXPIRED"), eq(order), any());
        verify(orderEventPublisher, never()).publish(eq("ORDER_CANCELED"), any(), any());
        verify(notificationService).notify(eq(1), eq(NotificationCategory.ORDER), eq("Limit order expired"),
                startsWith("Your limit buy of 2 AAPL at $95.00"), any());
    }

    @Test
    void limitReached_comparesBySide() {
        Order buy = pendingLimit(OrderType.BUY, "1", "100", null);
        Order sell = pendingLimit(OrderType.SELL, "1", "100", null);

        assertTrue(OrderService.limitReached(buy, bd("100.00")));
        assertTrue(OrderService.limitReached(buy, bd("99.99")));
        assertFalse(OrderService.limitReached(buy, bd("100.01")));
        assertTrue(OrderService.limitReached(sell, bd("100.00")));
        assertFalse(OrderService.limitReached(sell, bd("99.99")));
        assertFalse(OrderService.limitReached(sell, null));
    }

    private void stubSaveAssigningId(int id) {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            if (saved.getOrderId() == null) {
                saved.setOrderId(id);
            }
            return saved;
        });
    }

    private void stubQuote(double price, double bid, double ask) {
        when(pricingService.getRequestedQuotes(anyList(), anyMap())).thenReturn(List.of(
                new PricingQuoteDTO(2, "AAPL", price, null, bid, ask, null, null, "USD", null, false, "test", null, null)
        ));
    }

    private static OrderEventDTO event(int orderId, int instrumentId, String quantity, String orderType) {
        return new OrderEventDTO("ORDER_PLACED", LocalDateTime.now(), orderId, 1, null, instrumentId, bd(quantity), null,
                null, orderType, "PLACED", null, null);
    }

    private Account account(Integer accountId, String balance) {
        Account account = new Account();
        account.setAccountId(accountId);
        account.setUserId(1);
        account.setNickname("Main");
        account.setCashBalance(bd(balance));
        return account;
    }

    private AccountHolding holding(String quantity, String amountInvested) {
        AccountHolding holding = new AccountHolding();
        holding.setHoldingId(7);
        holding.setAccountId(1);
        holding.setInstrumentId(2);
        holding.setQuantity(bd(quantity));
        holding.setAmountInvested(bd(amountInvested));
        return holding;
    }

    private Instrument instrument(Integer instrumentId) {
        Instrument instrument = new Instrument();
        instrument.setInstrumentId(instrumentId);
        instrument.setTicker("AAPL");
        instrument.setName("Apple Inc.");
        instrument.setType(InstrumentType.equity);
        instrument.setExchange("NASDAQ");
        return instrument;
    }

    private Order order(Integer accountId, Integer instrumentId, String quantity, String price,
                        OrderType orderType, OrderStatus status) {
        Order order = new Order();
        order.setAccountId(accountId);
        order.setInstrumentId(instrumentId);
        order.setQuantity(bd(quantity));
        order.setStockPrice(price == null ? null : bd(price));
        order.setOrderType(orderType);
        order.setStatus(status);
        return order;
    }

    private static Order limit(Order order, String limitPrice) {
        order.setExecutionType(OrderExecution.LIMIT);
        order.setLimitPrice(bd(limitPrice));
        return order;
    }

    private Order pendingLimit(OrderType side, String quantity, String limitPrice, String reserved) {
        Order order = limit(order(1, 2, quantity, null, side, OrderStatus.PENDING), limitPrice);
        order.setOrderId(50);
        order.setReservedAmount(reserved == null ? null : bd(reserved));
        order.setExpiresAt(LocalDateTime.of(2027, 1, 1, 0, 0));
        return order;
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
