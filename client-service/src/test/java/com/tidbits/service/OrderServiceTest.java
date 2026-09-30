package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountHolding;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.Order;
import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.model.enums.InstrumentType;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.model.enums.TransactionType;
import com.tidbits.repository.AccountHoldingRepository;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.AccountTransactionRepository;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.OrderRepository;
import com.tidbits.repository.OrderStatusHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

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

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_throwsWhenBuyHasInsufficientCash() {
        Order order = order(1, 2, 10.0, 25.0, OrderType.BUY, null);
        when(accountRepository.findById(1)).thenReturn(Optional.of(account(1, 100.0)));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.createOrder(order));

        assertEquals("Insufficient cash balance for buy order.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrder_buyOrderUpdatesBalanceAndCreatesArtifacts() {
        Order order = order(1, 2, 10.0, 50.0, OrderType.BUY, null);
        Account account = account(1, 1000.0);

        when(accountRepository.findById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(1, 2)).thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            if (saved.getOrderId() == null) {
                saved.setOrderId(99);
            }
            return saved;
        });

        Order placed = orderService.createOrder(order);

        assertEquals(OrderStatus.PLACED, placed.getStatus());
        assertEquals(500.0, account.getCashBalance());

        ArgumentCaptor<AccountHolding> holdingCaptor = ArgumentCaptor.forClass(AccountHolding.class);
        verify(accountHoldingRepository).save(holdingCaptor.capture());
        assertEquals(10.0, holdingCaptor.getValue().getQuantity());
        assertEquals(500.0, holdingCaptor.getValue().getAmountInvested());

        ArgumentCaptor<AccountTransaction> txCaptor = ArgumentCaptor.forClass(AccountTransaction.class);
        verify(accountTransactionRepository).save(txCaptor.capture());
        assertEquals(99, txCaptor.getValue().getOrderId());
        assertEquals(500.0, txCaptor.getValue().getAmount());
        assertEquals(TransactionType.BUY, txCaptor.getValue().getTransactionType());

        verify(orderStatusHistoryRepository, times(2)).save(any(OrderStatusHistory.class));
    }

    @Test
    void createOrder_throwsWhenSellHasInsufficientQuantity() {
        Order order = order(1, 2, 5.0, 100.0, OrderType.SELL, null);
        Account account = account(1, 1000.0);
        AccountHolding holding = new AccountHolding(7, 1, 2, 2.0, 200.0, LocalDateTime.now());

        when(accountRepository.findById(1)).thenReturn(Optional.of(account));
        when(instrumentRepository.findById(2)).thenReturn(Optional.of(instrument(2)));
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(1, 2)).thenReturn(Optional.of(holding));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.createOrder(order));

        assertEquals("Insufficient holdings quantity for sell order.", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void updateOrderStatus_throwsForFinalStatusTransition() {
        Order order = order(1, 2, 1.0, 10.0, OrderType.BUY, OrderStatus.FILLED);
        order.setOrderId(3);
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
        when(orderRepository.findById(3)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.updateOrderStatus(1, 3, OrderStatus.ACCEPTED);

        assertEquals(OrderStatus.ACCEPTED, updated.getStatus());
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
    }

    private Account account(Integer accountId, Double balance) {
        Account account = new Account();
        account.setAccountId(accountId);
        account.setCashBalance(balance);
        return account;
    }

    private Instrument instrument(Integer instrumentId) {
        Instrument instrument = new Instrument();
        instrument.setInstrumentId(instrumentId);
        instrument.setTicker("AAPL");
        instrument.setName("Apple Inc.");
        instrument.setType(InstrumentType.EQUITY);
        instrument.setMarket("NASDAQ");
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
