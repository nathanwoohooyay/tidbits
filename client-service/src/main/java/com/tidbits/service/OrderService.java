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
import com.tidbits.model.enums.NotificationCategory;
import com.tidbits.model.enums.OrderExecution;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.model.enums.PointsEventType;
import com.tidbits.model.enums.TransactionType;
import com.tidbits.repository.AccountHoldingRepository;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.AccountTransactionRepository;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.OrderRepository;
import com.tidbits.repository.OrderStatusHistoryRepository;
import com.tidbits.util.Money;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.Clock;
import java.time.Duration;
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

    @Autowired
    private PointsLedgerService pointsLedgerService;

    @Autowired
    private MarketHoursService marketHours;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PortfolioSnapshotRecorder snapshotRecorder;

    @Autowired
    private Clock clock;

    // Unfilled limit orders are cancelled after this long.
    static final Duration LIMIT_ORDER_LIFETIME = Duration.ofDays(90);
    // No order has id 0; pass it to count every pending order.
    private static final Integer NO_ORDER = 0;

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
        order.setStockPrice(null);
        order.setReservedAmount(null);
        order.setExpiresAt(null);
        order.setQuantity(Money.shares(order.getQuantity()));
        if (order.getExecutionType() == null) {
            order.setExecutionType(OrderExecution.MARKET);
        }
        if (order.isLimit()) {
            order.setLimitPrice(Money.price(order.getLimitPrice()));
        } else {
            order.setLimitPrice(null);
        }
        LocalDateTime now = LocalDateTime.now(clock);
        order.setCreatedAt(now);

        // A market order while its market is open (always, for crypto) fills straight away, via the order consumer.
        if (!order.isLimit() && marketHours.isOpenFor(instrument.getType())) {
            orderStatusEvent(order, null, OrderStatus.PLACED);
            return order;
        }

        // Otherwise it waits (for its price, or for the open), so set aside what it needs to fill.
        if (order.getOrderType() == OrderType.BUY) {
            BigDecimal price = order.isLimit() ? order.getLimitPrice() : resolveQuotePrice(instrument, OrderType.BUY);
            // Fills charge quantity x price rounded down to the cent, and a limit buy fills at or below its limit, so
            // this always covers the eventual cost of a limit buy (a queued market order's is an estimate).
            BigDecimal reserve = Money.floorCents(order.getQuantity().multiply(price));
            BigDecimal available = availableCash(account, NO_ORDER);
            if (available.compareTo(reserve) < 0) {
                throw new BadRequestException("Not enough buying power: this order needs " + formatMoney(reserve)
                        + " and " + formatMoney(available) + " is available.");
            }
            order.setReservedAmount(reserve);
        } else {
            BigDecimal available = availableShares(account.getAccountId(), instrument.getInstrumentId(), NO_ORDER);
            if (available.compareTo(order.getQuantity()) < 0) {
                throw new BadRequestException("You can sell up to " + formatShares(available) + " shares of "
                        + instrument.getTicker() + " (the rest are already in open sell orders).");
            }
        }
        if (order.isLimit()) {
            order.setExpiresAt(now.plus(LIMIT_ORDER_LIFETIME));
        }
        orderStatusEvent(order, null, OrderStatus.PENDING);
        return order;
    }

    // Fills a market order placed while the market was open (from its ORDER_PLACED event).
    @Transactional
    public Order fillOrder(OrderEventDTO orderEvent) {
        validateOrderEvent(orderEvent);

        Account account = accountService.getAccountById(orderEvent.accountId()).orElseThrow(() -> new ResourceNotFoundException(
                "Account " + orderEvent.accountId() + " not found."));
        Order currOrder = getOrderByIdForAccount(orderEvent.accountId(), orderEvent.orderId(), false);
        if (currOrder.getStatus() != null && FINAL_STATUSES.contains(currOrder.getStatus())) {
            return currOrder;
        }

        OrderType orderType = parseOrderType(orderEvent.orderType());
        currOrder.setOrderType(orderType);

        Instrument instrument = instrumentRepository.findById(orderEvent.instrumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Instrument " + orderEvent.instrumentId() + " not found."));

        execute(currOrder, account, instrument, resolveQuotePrice(instrument, orderType), OrderStatus.PLACED);
        return currOrder;
    }

    // Tries to fill a waiting order at the live price: a queued market order fills at any price, a limit order only if
    // the price is at or better than its limit. Returns whether the order left PENDING (filled or rejected).
    @Transactional
    public boolean fillPendingOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING) {
            return false;
        }
        Account account = accountService.getAccountById(order.getAccountId()).orElseThrow(() -> new ResourceNotFoundException(
                "Account " + order.getAccountId() + " not found."));
        Instrument instrument = instrumentRepository.findById(order.getInstrumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Instrument " + order.getInstrumentId() + " not found."));

        BigDecimal price = resolveQuotePrice(instrument, order.getOrderType());
        if (order.isLimit() && !limitReached(order, price)) {
            return false;
        }
        execute(order, account, instrument, price, OrderStatus.PENDING);
        return true;
    }

    // A buy's limit is reached at or below it, a sell's at or above it.
    public static boolean limitReached(Order order, BigDecimal price) {
        if (price == null || order.getLimitPrice() == null) {
            return false;
        }
        int cmp = price.compareTo(order.getLimitPrice());
        return order.getOrderType() == OrderType.BUY ? cmp <= 0 : cmp >= 0;
    }

    @Transactional
    public Order cancelOrder(Integer accountId, Integer orderId) {
        Account account = getAuthorizedAccount(accountId);
        Order order = getOrderByIdForAccount(accountId, orderId, false);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only orders that haven't filled yet can be cancelled.");
        }
        order.setReservedAmount(null);
        orderStatusEvent(order, OrderStatus.PENDING, OrderStatus.CANCELED);
        Instrument instrument = instrumentRepository.findById(order.getInstrumentId()).orElse(null);
        notifyOrder(account, order, instrument, "Cancelled " + describe(order, instrument),
                order.isLimit() ? "Limit " + formatPrice(order.getLimitPrice()) + " · " + account.getNickname() : account.getNickname());
        return order;
    }

    // Cancels a limit order that has waited longer than LIMIT_ORDER_LIFETIME.
    @Transactional
    public void expireOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING) {
            return;
        }
        order.setReservedAmount(null);
        // Recorded as cancelled, but published as ORDER_EXPIRED so the audit trail can tell it from a user's cancel.
        orderStatusEvent(order, OrderStatus.PENDING, OrderStatus.CANCELED, "ORDER_EXPIRED");
        Account account = accountService.getAccountById(order.getAccountId()).orElse(null);
        if (account != null) {
            Instrument instrument = instrumentRepository.findById(order.getInstrumentId()).orElse(null);
            notifyOrder(account, order, instrument, "Limit order expired",
                    "Your " + describe(order, instrument) + " at " + formatPrice(order.getLimitPrice())
                            + " didn't fill within " + LIMIT_ORDER_LIFETIME.toDays() + " days.");
        }
    }

    // Cash the account can spend: its balance less what pending buys have set aside.
    public BigDecimal availableCash(Account account, Integer excludeOrderId) {
        BigDecimal reserved = Money.orZero(orderRepository.sumReservedCash(account.getAccountId(), excludeOrderId));
        return Money.orZero(account.getCashBalance()).subtract(reserved);
    }

    private BigDecimal availableShares(Integer accountId, Integer instrumentId, Integer excludeOrderId) {
        BigDecimal owned = accountHoldingRepository.findByAccountIdAndInstrumentId(accountId, instrumentId)
                .map(AccountHolding::getQuantity)
                .map(Money::orZero)
                .orElse(BigDecimal.ZERO);
        return owned.subtract(Money.orZero(orderRepository.sumReservedShares(accountId, instrumentId, excludeOrderId)));
    }

    // Applies an order at `price`: moves cash and shares, records the transaction, awards points, and notifies.
    private void execute(Order order, Account account, Instrument instrument, BigDecimal price, OrderStatus fromStatus) {
        order.setStockPrice(price);
        BigDecimal totalAmount = Money.floorCents(order.getQuantity().multiply(price));
        OrderType orderType = order.getOrderType();

        boolean status = orderType == OrderType.BUY
                ? processBuyOrder(account, order, totalAmount)
                : processSellOrder(account, order, totalAmount);

        order.setReservedAmount(null);
        if (!status) {
            orderStatusEvent(order, fromStatus, OrderStatus.REJECTED);
            notifyOrder(account, order, instrument, "Order rejected: " + describe(order, instrument),
                    orderType == OrderType.BUY
                            ? "There wasn't enough cash in " + account.getNickname() + " to cover " + formatMoney(totalAmount) + "."
                            : "There weren't enough shares in " + account.getNickname() + " to sell.");
            return;
        }

        accountRepository.save(account);

        AccountTransaction transaction = new AccountTransaction();
        transaction.setAccountId(account.getAccountId());
        transaction.setOrderId(order.getOrderId());
        transaction.setAmount(totalAmount);
        transaction.setTransactionType(orderType == OrderType.BUY ? TransactionType.BUY : TransactionType.SELL);
        transaction.setCreatedAt(LocalDateTime.now());
        AccountTransaction at = accountTransactionRepository.save(transaction);

        awardRewardPoints(account, order, totalAmount);

        orderStatusEvent(order, fromStatus, OrderStatus.ACCEPTED, at.getTransactionId());

        orderStatusEvent(order, OrderStatus.ACCEPTED, OrderStatus.FILLED, at.getTransactionId());

        String verb = orderType == OrderType.BUY ? "Bought " : "Sold ";
        String when = fromStatus == OrderStatus.PENDING && !order.isLimit() ? " at the open" : "";
        notifyOrder(account, order, instrument, verb + formatShares(order.getQuantity()) + " " + ticker(instrument) + when,
                formatMoney(totalAmount) + " at " + formatPrice(price)
                        + (order.isLimit() ? " (limit " + formatPrice(order.getLimitPrice()) + ")" : "")
                        + " · " + account.getNickname());

        snapshotRecorder.record(account);
    }

    private void awardRewardPoints(Account account, Order order, BigDecimal tradedVolume) {
        int points = tradedVolume
                .setScale(0, RoundingMode.FLOOR)
                .intValueExact();
        if (points <= 0) {
            return;
        }

        pointsLedgerService.record(account.getUserId(), PointsEventType.EARN_TRADE, points,
                new PointsLedgerService.Details(account.getAccountId(), tradedVolume.doubleValue(), order.getInstrumentId(),
                        order.getQuantity().doubleValue(), order.getOrderId(), "Earned on order #" + order.getOrderId()));
    }

    private void notifyOrder(Account account, Order order, Instrument instrument, String title, String message) {
        notificationService.notify(account.getUserId(), NotificationCategory.ORDER, title, message,
                NotificationService.Source.order(account.getAccountId(), order.getOrderId(), instrument == null ? null : instrument.getTicker()));
    }

    // e.g. "limit buy of 3 MSFT" or "buy of 3 MSFT".
    private static String describe(Order order, Instrument instrument) {
        return (order.isLimit() ? "limit " : "") + (order.getOrderType() == OrderType.BUY ? "buy" : "sell")
                + " of " + formatShares(order.getQuantity()) + " " + ticker(instrument);
    }

    private static String ticker(Instrument instrument) {
        return instrument == null || instrument.getTicker() == null ? "shares" : instrument.getTicker();
    }

    private static String formatMoney(BigDecimal value) {
        return NumberFormat.getCurrencyInstance(Locale.US).format(Money.orZero(value));
    }

    // Prices under a dollar (most coins) keep up to 6 decimal places: $0.0775, not $0.08.
    private static String formatPrice(BigDecimal value) {
        BigDecimal price = Money.orZero(value);
        if (price.abs().compareTo(BigDecimal.ONE) >= 0) {
            return formatMoney(price);
        }
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.US);
        format.setMaximumFractionDigits(6);
        return format.format(price);
    }

    private static String formatShares(BigDecimal value) {
        return Money.orZero(value).stripTrailingZeros().toPlainString();
    }

    private void orderStatusEvent(Order order, OrderStatus oldStatus, OrderStatus newStatus, Integer transactionId) {
        order.setStatus(newStatus);
        Order createdOrder = orderRepository.save(order);
        orderStatusHistoryService.switchStatus(order, oldStatus, newStatus);
        
        publishOrderEvent("ORDER_" + newStatus.name(), order, transactionId);
    }

    private void orderStatusEvent(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        orderStatusEvent(order, oldStatus, newStatus, "ORDER_" + newStatus.name());
    }

    private void orderStatusEvent(Order order, OrderStatus oldStatus, OrderStatus newStatus, String eventType) {
        order.setStatus(newStatus);
        Order createdOrder = orderRepository.save(order);
        orderStatusHistoryService.switchStatus(order, oldStatus, newStatus);
        
        publishOrderEvent(eventType, order);
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

    private void publishOrderEvent(String eventType, Order order, Integer transactionId) {
        orderEventPublisher.publish(eventType, order, toResponseDto(order), transactionId);
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
        dto.setExecutionType((order.getExecutionType() == null ? OrderExecution.MARKET : order.getExecutionType()).name());
        dto.setLimitPrice(order.getLimitPrice());
        dto.setReservedAmount(order.getStatus() == OrderStatus.PENDING ? order.getReservedAmount() : null);
        dto.setCreatedAt(order.getCreatedAt());
        dto.setExpiresAt(order.getExpiresAt());

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

        if (order.getQuantity() == null || Money.shares(order.getQuantity()).signum() <= 0) {
            throw new BadRequestException("Order quantity must be at least 0.0001 shares.");
        }

        if (order.isLimit() && (order.getLimitPrice() == null || Money.price(order.getLimitPrice()).signum() <= 0)) {
            throw new BadRequestException("A limit order needs a limit price greater than zero.");
        }
    }

    private BigDecimal resolveQuotePrice(Instrument instrument, OrderType orderType) {
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

        return BigDecimal.valueOf(sidePrice);
    }

    // Spends from cash not set aside by the account's other pending buys (this order's own reservation is released).
    private boolean processBuyOrder(Account account, Order order, BigDecimal totalAmount) {
        if (availableCash(account, order.getOrderId()).compareTo(totalAmount) < 0) {
            return false;
        }

        account.setCashBalance(Money.orZero(account.getCashBalance()).subtract(totalAmount));

        AccountHolding holding = accountHoldingRepository
                .findByAccountIdAndInstrumentId(account.getAccountId(), order.getInstrumentId())
                .orElseGet(AccountHolding::new);

        if (holding.getHoldingId() == null) {
            holding.setAccountId(account.getAccountId());
            holding.setInstrumentId(order.getInstrumentId());
            holding.setQuantity(BigDecimal.ZERO);
            holding.setAmountInvested(BigDecimal.ZERO);
        }

        holding.setQuantity(Money.orZero(holding.getQuantity()).add(order.getQuantity()));
        holding.setAmountInvested(Money.orZero(holding.getAmountInvested()).add(totalAmount));
        holding.setLastUpdated(LocalDateTime.now());
        accountHoldingRepository.save(holding);
        return true;
    }

    // Sells from shares not promised to the account's other pending sells.
    private boolean processSellOrder(Account account, Order order, BigDecimal totalAmount) {
        Optional<AccountHolding> holdingOpt = accountHoldingRepository
                .findByAccountIdAndInstrumentId(account.getAccountId(), order.getInstrumentId());
        BigDecimal quantity = order.getQuantity();

        if (holdingOpt.isEmpty() || holdingOpt.get().getQuantity() == null
                || availableShares(account.getAccountId(), order.getInstrumentId(), order.getOrderId()).compareTo(quantity) < 0) {
            return false;
        }
        AccountHolding holding = holdingOpt.get();

        BigDecimal previousQuantity = holding.getQuantity();
        BigDecimal remainingQuantity = previousQuantity.subtract(quantity);
        if (remainingQuantity.signum() == 0) {
            accountHoldingRepository.delete(holding);
        } else {
            // Cost basis shrinks in proportion to the shares sold; kept at least a cent (the column must stay positive).
            BigDecimal previousAmount = Money.orZero(holding.getAmountInvested());
            BigDecimal adjustedAmount = previousAmount.multiply(remainingQuantity)
                    .divide(previousQuantity, Money.CENT_SCALE, RoundingMode.HALF_UP)
                    .max(new BigDecimal("0.01"));
            holding.setQuantity(remainingQuantity);
            holding.setAmountInvested(adjustedAmount);
            holding.setLastUpdated(LocalDateTime.now());
            accountHoldingRepository.save(holding);
        }

        account.setCashBalance(Money.orZero(account.getCashBalance()).add(totalAmount));

        return true;
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
