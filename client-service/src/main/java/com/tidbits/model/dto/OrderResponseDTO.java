package com.tidbits.model.dto;

import java.math.BigDecimal;

import java.time.LocalDateTime;
import java.util.List;

public class OrderResponseDTO {
    private Integer orderId;
    private BigDecimal quantity;
    private BigDecimal price;
    private String orderType;
    private String status;
    private InstrumentDTO instrument;
    private List<OrderStatusHistoryDTO> statusHistory;
    // MARKET or LIMIT.
    private String executionType;
    private BigDecimal limitPrice;
    // Cash set aside for a pending buy; null once the order is no longer pending.
    private BigDecimal reservedAmount;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    public OrderResponseDTO() {
    }

    public OrderResponseDTO(Integer orderId, BigDecimal quantity, BigDecimal price,
                           String orderType, String status, InstrumentDTO instrument,
                            List<OrderStatusHistoryDTO> statusHistory) {
        this.orderId = orderId;
        this.quantity = quantity;
        this.price = price;
        this.orderType = orderType;
        this.status = status;
        this.instrument = instrument;
        this.statusHistory = statusHistory;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public InstrumentDTO getInstrument() {
        return instrument;
    }

    public void setInstrument(InstrumentDTO instrument) {
        this.instrument = instrument;
    }

    public List<OrderStatusHistoryDTO> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<OrderStatusHistoryDTO> statusHistory) {
        this.statusHistory = statusHistory;
    }

    public String getExecutionType() { return executionType; }
    public void setExecutionType(String executionType) { this.executionType = executionType; }

    public BigDecimal getLimitPrice() { return limitPrice; }
    public void setLimitPrice(BigDecimal limitPrice) { this.limitPrice = limitPrice; }

    public BigDecimal getReservedAmount() { return reservedAmount; }
    public void setReservedAmount(BigDecimal reservedAmount) { this.reservedAmount = reservedAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
