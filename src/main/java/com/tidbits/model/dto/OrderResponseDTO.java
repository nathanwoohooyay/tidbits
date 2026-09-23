package com.tidbits.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public class OrderResponseDTO {
    private Integer orderId;
    private Integer accountId;
    private Integer instrumentId;
    private Integer quantity;
    private Double price;
    private String orderType;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime executedAt;
    private InstrumentDTO instrument;
    private AccountDTO account;
    private List<OrderStatusHistoryDTO> statusHistory;

    public OrderResponseDTO() {
    }

    public OrderResponseDTO(Integer orderId, Integer accountId, Integer instrumentId, Integer quantity, Double price,
                           String orderType, String status, LocalDateTime createdAt, LocalDateTime executedAt,
                           InstrumentDTO instrument, AccountDTO account, List<OrderStatusHistoryDTO> statusHistory) {
        this.orderId = orderId;
        this.accountId = accountId;
        this.instrumentId = instrumentId;
        this.quantity = quantity;
        this.price = price;
        this.orderType = orderType;
        this.status = status;
        this.createdAt = createdAt;
        this.executedAt = executedAt;
        this.instrument = instrument;
        this.account = account;
        this.statusHistory = statusHistory;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public Integer getInstrumentId() {
        return instrumentId;
    }

    public void setInstrumentId(Integer instrumentId) {
        this.instrumentId = instrumentId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }

    public InstrumentDTO getInstrument() {
        return instrument;
    }

    public void setInstrument(InstrumentDTO instrument) {
        this.instrument = instrument;
    }

    public AccountDTO getAccount() {
        return account;
    }

    public void setAccount(AccountDTO account) {
        this.account = account;
    }

    public List<OrderStatusHistoryDTO> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<OrderStatusHistoryDTO> statusHistory) {
        this.statusHistory = statusHistory;
    }
}
