package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.Order;
import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.model.enums.InstrumentType;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.repository.AccountHoldingRepository;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.AccountTransactionRepository;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.OrderRepository;
import com.tidbits.repository.OrderStatusHistoryRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @BeforeEach
    void setUpAuthentication() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("1", null));
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
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private InstrumentRepository instrumentRepository;

    @Mock
    private PricingService pricingService;

    @Mock
    private OrderEventPublisher orderEventPublisher;

    @InjectMocks
    private OrderService orderService;

    @Test
    void requestOrder_throwsWhenOrderPayloadMissingRequiredFields() {
        Order order = order(1, 2, 10.0, 25.0, null, null);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.requestOrder(order));

        assertEquals("Account, instrument, and order type are required.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void requestOrder_setsPlacedStatusAndPublishesPlacementEvent() {
        Order order = order(1, 2, 10.0, 50.0, OrderType.BUY, null);
        Account account = account(1, 1000.0);

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            if (saved.getOrderId() == null) {
                saved.setOrderId(99);
            }
            return saved;
        });

        Order placed = orderService.requestOrder(order);

        assertEquals(OrderStatus.PLACED, placed.getStatus());
        assertEquals(99, placed.getOrderId());

        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
        verify(orderEventPublisher).publish(eq("ORDER_PLACED"), eq(placed), any());
    }

    @Test
    void requestOrder_throwsWhenInstrumentMissing() {
        Order order = order(1, 2, 5.0, 100.0, OrderType.SELL, null);
        Account account = account(1, 1000.0);

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> orderService.requestOrder(order));

        assertEquals("Instrument 2 not found.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void requestOrder_throwsWhenAuthenticatedUserDoesNotOwnAccount() {
        Order order = order(1, 2, 2.0, 1.0, OrderType.SELL, null);
        Account account = account(1, 1000.0);
        account.setUserId(77);

        when(accountService.getAccountById(1)).thenReturn(Optional.of(account));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> orderService.requestOrder(order));

        assertEquals("Authenticated user does not own account 1.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void updateOrderStatus_throwsForFinalStatusTransition() {
        Order order = order(1, 2, 1.0, 10.0, OrderType.BUY, OrderStatus.FILLED);
        order.setOrderId(3);
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, 1000.0)));
        when(orderRepository.findById(3)).thenReturn(Optional.of(order));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> orderService.updateOrderStatus(1, 3, OrderStatus.CANCELED)
        );

        assertEquals("Cannot change status from final state FILLED.", ex.getMessage());
    }

    @Test
    void updateOrderStatus_updatesAndTracksHistoryForValidTransition() {
        Order order = order(1, 2, 1.0, 10.0, OrderType.BUY, OrderStatus.PLACED);
        order.setOrderId(3);
        when(accountService.getAccountById(1)).thenReturn(Optional.of(account(1, 1000.0)));
        when(orderRepository.findById(3)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.updateOrderStatus(1, 3, OrderStatus.ACCEPTED);

        assertEquals(OrderStatus.ACCEPTED, updated.getStatus());
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
        verify(orderEventPublisher).publish(eq("ORDER_STATUS_UPDATED"), eq(updated), any());
    }

    private Account account(Integer accountId, Double balance) {
        Account account = new Account();
        account.setAccountId(accountId);
        account.setUserId(1);
        account.setCashBalance(balance);
        return account;
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

    private Order order(Integer accountId, Integer instrumentId, Double quantity, Double price,
                        OrderType orderType, OrderStatus status) {
        Order order = new Order();
        order.setAccountId(accountId);
        order.setInstrumentId(instrumentId);
        order.setQuantity(quantity);
        order.setStockPrice(price);
        order.setOrderType(orderType);
        order.setStatus(status);
        return order;
    }
}
