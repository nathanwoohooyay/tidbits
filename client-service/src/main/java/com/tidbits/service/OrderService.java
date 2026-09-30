package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.dto.InstrumentDTO;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AccountHoldingRepository accountHoldingRepository;

    @Autowired
    private AccountTransactionRepository accountTransactionRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private InstrumentRepository instrumentRepository;

    private static final Set<OrderStatus> FINAL_STATUSES = Set.of(
            OrderStatus.FILLED,
            OrderStatus.CANCELED,
            OrderStatus.REJECTED
    );

    @Transactional
    public Order createOrder(Order order) {
        validateOrderRequest(order);

        Account account = accountRepository.findById(order.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account " + order.getAccountId() + " not found."));

        instrumentRepository.findById(order.getInstrumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Instrument " + order.getInstrumentId() + " not found."));

        double totalAmount = order.getQuantity() * order.getStockPrice();
        if (order.getOrderType() == OrderType.BUY) {
            processBuyOrder(account, order.getInstrumentId(), order.getQuantity(), totalAmount);
        } else {
            processSellOrder(account, order.getInstrumentId(), order.getQuantity(), totalAmount);
        }

        accountRepository.save(account);

        order.setOrderId(null);
        order.setStatus(OrderStatus.CREATED);
        Order createdOrder = orderRepository.save(order);
        createStatusHistory(createdOrder.getOrderId(), null, OrderStatus.CREATED);

        createdOrder.setStatus(OrderStatus.PLACED);
        Order placedOrder = orderRepository.save(createdOrder);
        createStatusHistory(placedOrder.getOrderId(), OrderStatus.CREATED, OrderStatus.PLACED);

        AccountTransaction transaction = new AccountTransaction();
        transaction.setAccountId(account.getAccountId());
        transaction.setOrderId(placedOrder.getOrderId());
        transaction.setAmount(totalAmount);
        transaction.setTransactionType(order.getOrderType() == OrderType.BUY ? TransactionType.BUY : TransactionType.SELL);
        transaction.setCreatedAt(LocalDateTime.now());
        accountTransactionRepository.save(transaction);

        return placedOrder;
    }

    public Order getOrderByIdForAccount(Integer accountId, Integer orderId) {
        return orderRepository.findById(orderId)
                .filter(order -> order.getAccountId().equals(accountId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Order " + orderId + " not found for account " + accountId + "."));
    }

    public List<Order> getOrdersByAccountId(Integer accountId) {
        return orderRepository.findByAccountId(accountId);
    }

    @Transactional
    public Order updateOrder(Integer orderId, Order order) {
        Order existingOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId + " not found."));

        if (order.getQuantity() != null && order.getQuantity() > 0) {
            existingOrder.setQuantity(order.getQuantity());
        }

        if (order.getStockPrice() != null && order.getStockPrice() > 0) {
            existingOrder.setStockPrice(order.getStockPrice());
        }

        if (order.getOrderType() != null) {
            existingOrder.setOrderType(order.getOrderType());
        }

        if (order.getStatus() != null && order.getStatus() != existingOrder.getStatus()) {
            OrderStatus oldStatus = existingOrder.getStatus();
            validateStatusTransition(oldStatus, order.getStatus());
            existingOrder.setStatus(order.getStatus());
            createStatusHistory(existingOrder.getOrderId(), oldStatus, order.getStatus());
        }

        return orderRepository.save(existingOrder);
    }

    @Transactional
    public Order updateOrderStatus(Integer accountId, Integer orderId, OrderStatus newStatus) {
        Order order = getOrderByIdForAccount(accountId, orderId);

        if (order.getStatus() == newStatus) {
            return order;
        }

        validateStatusTransition(order.getStatus(), newStatus);

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        createStatusHistory(orderId, oldStatus, newStatus);
        return updated;
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

        if (order.getStockPrice() == null || order.getStockPrice() <= 0) {
            throw new BadRequestException("Order price must be greater than zero.");
        }
    }

    private void processBuyOrder(Account account, Integer instrumentId, Double quantity, double totalAmount) {
        double currentBalance = account.getCashBalance() == null ? 0.0 : account.getCashBalance();
        if (currentBalance < totalAmount) {
            throw new BadRequestException("Insufficient cash balance for buy order.");
        }

        account.setCashBalance(currentBalance - totalAmount);

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
    }

    private void processSellOrder(Account account, Integer instrumentId, Double quantity, double totalAmount) {
        AccountHolding holding = accountHoldingRepository
                .findByAccountIdAndInstrumentId(account.getAccountId(), instrumentId)
                .orElseThrow(() -> new BadRequestException("No holdings available to sell for instrument " + instrumentId + "."));

        if (holding.getQuantity() == null || holding.getQuantity() < quantity) {
            throw new BadRequestException("Insufficient holdings quantity for sell order.");
        }

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
        account.setCashBalance(currentBalance + totalAmount);
    }

    private void createStatusHistory(Integer orderId, OrderStatus oldStatus, OrderStatus newStatus) {
        OrderStatusHistory statusHistory = new OrderStatusHistory();
        statusHistory.setOrderId(orderId);
        statusHistory.setChangedAt(LocalDateTime.now());
        statusHistory.setOldStatus(oldStatus);
        statusHistory.setNewStatus(newStatus);
        orderStatusHistoryRepository.save(statusHistory);
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        if (currentStatus == null) {
            return;
        }

        if (FINAL_STATUSES.contains(currentStatus)) {
            throw new BadRequestException("Cannot change status from final state " + currentStatus + ".");
        }

        switch (currentStatus) {
            case CREATED -> {
                if (!(newStatus == OrderStatus.PENDING || newStatus == OrderStatus.PLACED || newStatus == OrderStatus.CANCELED || newStatus == OrderStatus.REJECTED)) {
                    throw new BadRequestException("Invalid status transition from CREATED to " + newStatus + ".");
                }
            }
            case PENDING -> {
                if (!(newStatus == OrderStatus.PLACED || newStatus == OrderStatus.CANCELED || newStatus == OrderStatus.REJECTED)) {
                    throw new BadRequestException("Invalid status transition from PENDING to " + newStatus + ".");
                }
            }
            case PLACED -> {
                if (!(newStatus == OrderStatus.ACCEPTED || newStatus == OrderStatus.CANCELED || newStatus == OrderStatus.REJECTED)) {
                    throw new BadRequestException("Invalid status transition from PLACED to " + newStatus + ".");
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
