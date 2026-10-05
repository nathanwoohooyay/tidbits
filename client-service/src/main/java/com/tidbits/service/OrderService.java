package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.dto.InstrumentDTO;
import com.tidbits.model.dto.OrderEventDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.model.dto.OrderResponseDTO;
import com.tidbits.model.dto.OrderStatusHistoryDTO;
import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountHolding;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.Order;
import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.model.enums.TransactionType;
import com.tidbits.repository.AccountHoldingRepository;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.AccountTransactionRepository;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.OrderRepository;
import com.tidbits.repository.OrderStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AccountHoldingRepository accountHoldingRepository;

    @Autowired
    private AccountTransactionRepository accountTransactionRepository;

    @Autowired
    private OrderStatusHistoryService orderStatusHistoryService;

    @Autowired
    private InstrumentRepository instrumentRepository;

    @Autowired
    private PricingService pricingService;

    @Autowired
    private OrderEventPublisher orderEventPublisher;

    private static final Set<OrderStatus> FINAL_STATUSES = Set.of(
            OrderStatus.FILLED,
            OrderStatus.CANCELED,
            OrderStatus.REJECTED
    );

    public Order requestOrder(Order order) {
        validateOrderRequest(order);

        Account account = getAuthorizedAccount(order.getAccountId());

        Instrument instrument = instrumentRepository.findById(order.getInstrumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Instrument " + order.getInstrumentId() + " not found."));

        order.setOrderId(null);
        orderStatusEvent(order, null, OrderStatus.PLACED);

        return order;
    }

    @Transactional
    public Order fillOrder(OrderEventDTO orderEvent) {
        validateOrderEvent(orderEvent);

        Account account = accountService.getAccountById(orderEvent.accountId()).orElseThrow(() -> new ResourceNotFoundException(
                "Account " + orderEvent.accountId() + " not found."));
        Order currOrder = getOrderByIdForAccount(orderEvent.accountId(), orderEvent.orderId(), false);

        OrderType orderType = parseOrderType(orderEvent.orderType());
        currOrder.setOrderType(orderType);

        Instrument instrument = instrumentRepository.findById(orderEvent.instrumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Instrument " + orderEvent.instrumentId() + " not found."));

        double quotePrice = resolveQuotePrice(instrument, orderType);
        currOrder.setStockPrice(quotePrice);

        double totalAmount = floorToTwoDecimals(currOrder.getQuantity() * currOrder.getStockPrice());

        boolean status = true;
        if (orderType == OrderType.BUY) {
            status = processBuyOrder(account, currOrder.getInstrumentId(), currOrder.getQuantity(), totalAmount);
        } else {
            status = processSellOrder(account, currOrder.getInstrumentId(), currOrder.getQuantity(), totalAmount);
        }

        if (!status) {
            orderStatusEvent(currOrder, OrderStatus.PLACED, OrderStatus.REJECTED);
            return currOrder;
        }

        accountRepository.save(account);

        AccountTransaction transaction = new AccountTransaction();
        transaction.setAccountId(account.getAccountId());
        transaction.setOrderId(currOrder.getOrderId());
        transaction.setAmount(totalAmount);
        transaction.setTransactionType(orderType == OrderType.BUY ? TransactionType.BUY : TransactionType.SELL);
        transaction.setCreatedAt(LocalDateTime.now());
        accountTransactionRepository.save(transaction);

        orderStatusEvent(currOrder, OrderStatus.PLACED, OrderStatus.ACCEPTED);

        orderStatusEvent(currOrder, OrderStatus.ACCEPTED, OrderStatus.FILLED);


        return currOrder;
    }

    private void orderStatusEvent(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        order.setStatus(newStatus);
        Order createdOrder = orderRepository.save(order);
        orderStatusHistoryService.switchStatus(order, oldStatus, newStatus);
        
        publishOrderEvent("ORDER_" + newStatus.name(), order);
    }

    public Order getOrderByIdForAccount(Integer accountId, Integer orderId) {
        return getOrderByIdForAccount(accountId, orderId, true);
    }

    private Order getOrderByIdForAccount(Integer accountId, Integer orderId, boolean requireAuthorization) {
        if (requireAuthorization) {
            getAuthorizedAccount(accountId);
        }

        return orderRepository.findById(orderId)
                .filter(order -> order.getAccountId().equals(accountId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Order " + orderId + " not found for account " + accountId + "."));
    }

    public List<Order> getOrdersByAccountId(Integer accountId) {
        getAuthorizedAccount(accountId);
        return orderRepository.findByAccountId(accountId);
    }

    private void publishOrderEvent(String eventType, Order order) {
        orderEventPublisher.publish(eventType, order, toResponseDto(order));
    }

    private Account getAuthorizedAccount(Integer accountId) {
        Account account = accountService.getAccountById(accountId).orElseThrow(() -> new ResourceNotFoundException(
                "Account " + accountId + " not found."));

        Integer authenticatedUserId = getAuthenticatedUserId();
        if (!authenticatedUserId.equals(account.getUserId())) {
            throw new AccessDeniedException("Authenticated user does not own account " + accountId + ".");
        }

        return account;
    }

    private void validateOrderEvent(OrderEventDTO orderEvent) {
        if (orderEvent == null) {
            throw new BadRequestException("Order event payload is required.");
        }

        if (orderEvent.accountId() == null || orderEvent.instrumentId() == null || orderEvent.orderId() == null || orderEvent.orderType() == null) {
            throw new BadRequestException("Order event must include order, account, instrument, and order type.");
        }
    }

    private OrderType parseOrderType(String orderType) {
        try {
            return OrderType.valueOf(orderType.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException ex) {
            throw new BadRequestException("Unsupported order type: " + orderType);
        }
    }

    private Integer getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("Authenticated user id is required.");
        }

        try {
            return Integer.valueOf(authentication.getName());
        } catch (NumberFormatException ex) {
            throw new AccessDeniedException("Authenticated user id is invalid.");
        }
    }

    public OrderResponseDTO toResponseDto(Order order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderId(order.getOrderId());
        dto.setQuantity(order.getQuantity());
        dto.setPrice(order.getStockPrice());
        dto.setOrderType(order.getOrderType() == null ? null : order.getOrderType().name());
        dto.setStatus(order.getStatus() == null ? null : order.getStatus().name());

        Instrument instrument = instrumentRepository.findById(order.getInstrumentId()).orElse(null);
        if (instrument != null) {
            InstrumentDTO instrumentDTO = new InstrumentDTO();
            instrumentDTO.setInstrumentId(instrument.getInstrumentId());
            instrumentDTO.setTicker(instrument.getTicker());
            instrumentDTO.setName(instrument.getName());
            instrumentDTO.setType(instrument.getType());
            instrumentDTO.setExchange(instrument.getExchange());
            dto.setInstrument(instrumentDTO);
        }

        List<OrderStatusHistoryDTO> history = orderStatusHistoryService.getHistoryByOrderId(order.getOrderId()).stream()
                .sorted(Comparator.comparing(OrderStatusHistory::getChangedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toHistoryDto)
                .collect(Collectors.toList());
        dto.setStatusHistory(history);

        return dto;
    }

    public List<OrderResponseDTO> toResponseDtoList(List<Order> orders) {
        return orders.stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    private OrderStatusHistoryDTO toHistoryDto(OrderStatusHistory history) {
        OrderStatusHistoryDTO dto = new OrderStatusHistoryDTO();
        dto.setHistoryId(history.getHistoryId());
        dto.setChangedAt(history.getChangedAt());
        dto.setOldStatus(history.getOldStatus());
        dto.setNewStatus(history.getNewStatus());
        return dto;
    }

    private void validateOrderRequest(Order order) {
        if (order == null) {
            throw new BadRequestException("Order payload is required.");
        }

        if (order.getAccountId() == null || order.getInstrumentId() == null || order.getOrderType() == null) {
            throw new BadRequestException("Account, instrument, and order type are required.");
        }

        if (order.getQuantity() == null || order.getQuantity() <= 0) {
            throw new BadRequestException("Order quantity must be greater than zero.");
        }
    }

    private double resolveQuotePrice(Instrument instrument, OrderType orderType) {
        if (instrument.getTicker() == null || instrument.getTicker().isBlank()) {
            throw new BadRequestException("Instrument " + instrument.getInstrumentId() + " is missing a ticker symbol.");
        }

        List<PricingQuoteDTO> quotes = pricingService.getRequestedQuotes(
            List.of(instrument.getTicker()),
            Map.of(instrument.getTicker().toUpperCase(Locale.ROOT), instrument)
        );
        if (quotes.isEmpty()) {
            throw new BadRequestException("No quote data was returned for symbol " + instrument.getTicker() + ".");
        }

        PricingQuoteDTO quote = quotes.get(0);
        if (quote.errorCode() != null) {
            String errorMessage = quote.errorMessage() == null ? quote.errorCode() : quote.errorCode() + ": " + quote.errorMessage();
            throw new BadRequestException("Quote request failed for symbol " + instrument.getTicker() + ". " + errorMessage);
        }

        Double sidePrice = orderType == OrderType.BUY ? quote.ask() : quote.bid();
        String side = orderType == OrderType.BUY ? "ask" : "bid";
        if (sidePrice == null || sidePrice <= 0) {
            throw new BadRequestException("Invalid " + side + " quote price returned for symbol " + instrument.getTicker() + ".");
        }

        return sidePrice;
    }

    private boolean processBuyOrder(Account account, Integer instrumentId, Double quantity, double totalAmount) {
        double currentBalance = account.getCashBalance() == null ? 0.0 : account.getCashBalance();
        if (currentBalance < totalAmount) {
            return false;
        }

        account.setCashBalance(floorToTwoDecimals(currentBalance - totalAmount));

        AccountHolding holding = accountHoldingRepository
                .findByAccountIdAndInstrumentId(account.getAccountId(), instrumentId)
                .orElseGet(AccountHolding::new);

        if (holding.getHoldingId() == null) {
            holding.setAccountId(account.getAccountId());
            holding.setInstrumentId(instrumentId);
            holding.setQuantity(0.0);
            holding.setAmountInvested(0.0);
        }

        holding.setQuantity(holding.getQuantity() + quantity);
        holding.setAmountInvested(holding.getAmountInvested() + totalAmount);
        holding.setLastUpdated(LocalDateTime.now());
        accountHoldingRepository.save(holding);
        return true;
    }

    private boolean processSellOrder(Account account, Integer instrumentId, Double quantity, double totalAmount) {
        Optional<AccountHolding> holdingOpt = accountHoldingRepository
                .findByAccountIdAndInstrumentId(account.getAccountId(), instrumentId);

        if (holdingOpt.isEmpty() || holdingOpt.get().getQuantity() == null || holdingOpt.get().getQuantity() < quantity) {
            return false;
        }
        AccountHolding holding = holdingOpt.get();

        double previousQuantity = holding.getQuantity();
        double remainingQuantity = previousQuantity - quantity;
        if (remainingQuantity == 0) {
            accountHoldingRepository.delete(holding);
        } else {
            double previousAmount = holding.getAmountInvested() == null ? 0.0 : holding.getAmountInvested();
            double adjustedAmount = previousAmount * (remainingQuantity / previousQuantity);
            holding.setQuantity(remainingQuantity);
            holding.setAmountInvested(adjustedAmount);
            holding.setLastUpdated(LocalDateTime.now());
            accountHoldingRepository.save(holding);
        }

        double currentBalance = account.getCashBalance() == null ? 0.0 : account.getCashBalance();
        account.setCashBalance(floorToTwoDecimals(currentBalance + totalAmount));

        return true;
    }

    private double floorToTwoDecimals(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.FLOOR).doubleValue();
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        if (currentStatus == null) {
            return;
        }

        if (FINAL_STATUSES.contains(currentStatus)) {
            throw new BadRequestException("Cannot change status from final state " + currentStatus + ".");
        }

        switch (currentStatus) {
            case PLACED -> {
                if (!(newStatus == OrderStatus.PENDING || newStatus == OrderStatus.ACCEPTED || newStatus == OrderStatus.CANCELED || newStatus == OrderStatus.REJECTED)) {
                    throw new BadRequestException("Invalid status transition from PLACED to " + newStatus + ".");
                }
            }
            case PENDING -> {
                if (!(newStatus == OrderStatus.PLACED || newStatus == OrderStatus.CANCELED || newStatus == OrderStatus.REJECTED)) {
                    throw new BadRequestException("Invalid status transition from PENDING to " + newStatus + ".");
                }
            }
            case ACCEPTED -> {
                if (!(newStatus == OrderStatus.FILLED || newStatus == OrderStatus.CANCELED)) {
                    throw new BadRequestException("Invalid status transition from ACCEPTED to " + newStatus + ".");
                }
            }
            default -> throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + newStatus + ".");
        }
    }
}
