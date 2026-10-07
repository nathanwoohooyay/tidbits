package com.tidbits.model.dto;

import com.tidbits.model.enums.OrderType;
import com.tidbits.model.enums.OrderStatus;
import java.util.Date;

public class OrderDTO {
    private Integer orderId;
    private Integer accountId;
    private Integer instrumentId;
    private Double quantity;
    private Double stockPrice;
    private OrderType orderType;
    private OrderStatus status;
    private Date lastUpdatedAt;

    public OrderDTO() {
    }

    public OrderDTO(Integer orderId, Integer accountId, Integer instrumentId, Double quantity, Double stockPrice,
                    OrderType orderType, OrderStatus status, Date lastUpdatedAt) {
        this.orderId = orderId;
        this.accountId = accountId;
        this.instrumentId = instrumentId;
        this.quantity = quantity;
        this.stockPrice = stockPrice;
        this.orderType = orderType;
        this.status = status;
        this.lastUpdatedAt = lastUpdatedAt;
    }

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public Integer getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Integer instrumentId) { this.instrumentId = instrumentId; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getStockPrice() { return stockPrice; }
    public void setStockPrice(Double stockPrice) { this.stockPrice = stockPrice; }
    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public Date getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(Date lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }
}
