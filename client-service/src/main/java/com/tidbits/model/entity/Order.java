package com.tidbits.model.entity;

import jakarta.persistence.*;
import com.tidbits.model.enums.OrderExecution;
import com.tidbits.model.enums.OrderType;
import com.tidbits.model.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "account_id", nullable = false)
    private Integer accountId;

    @Column(name = "instrument_id", nullable = false)
    private Integer instrumentId;

    @Column(name = "quantity", precision = 17, scale = 4)
    private BigDecimal quantity;

    @Column(name = "stock_price", precision = 19, scale = 8)
    private BigDecimal stockPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type")
    private OrderType orderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderStatus status;

    // Null on orders placed before limit orders existed; those were all market orders.
    @Enumerated(EnumType.STRING)
    @Column(name = "execution_type", length = 16)
    private OrderExecution executionType;

    @Column(name = "limit_price", precision = 19, scale = 8)
    private BigDecimal limitPrice;

    // Cash set aside while a buy waits to fill (limit price x quantity, or the estimated cost of a queued market order),
    // so it can't be spent twice. Only counts while the order is PENDING.
    @Column(name = "reserved_amount", precision = 15, scale = 2)
    private BigDecimal reservedAmount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // When an unfilled limit order is cancelled automatically.
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public Order() {
    }

    public Order(Integer orderId, Integer accountId, Integer instrumentId, BigDecimal quantity, BigDecimal stockPrice,
                 OrderType orderType, OrderStatus status) {
        this.orderId = orderId;
        this.accountId = accountId;
        this.instrumentId = instrumentId;
        this.quantity = quantity;
        this.stockPrice = stockPrice;
        this.orderType = orderType;
        this.status = status;
    }

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getStockPrice() { return stockPrice; }
    public void setStockPrice(BigDecimal stockPrice) { this.stockPrice = stockPrice; }

    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public OrderExecution getExecutionType() { return executionType; }
    public void setExecutionType(OrderExecution executionType) { this.executionType = executionType; }

    public boolean isLimit() { return executionType == OrderExecution.LIMIT; }

    public BigDecimal getLimitPrice() { return limitPrice; }
    public void setLimitPrice(BigDecimal limitPrice) { this.limitPrice = limitPrice; }

    public BigDecimal getReservedAmount() { return reservedAmount; }
    public void setReservedAmount(BigDecimal reservedAmount) { this.reservedAmount = reservedAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
