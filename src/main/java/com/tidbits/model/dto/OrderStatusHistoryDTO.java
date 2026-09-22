package com.tidbits.model.dto;

import com.tidbits.model.enums.OrderStatus;
import java.time.LocalDateTime;

public class OrderStatusHistoryDTO {
    private Integer historyId;
    private Integer orderId;
    private LocalDateTime changedAt;
    private OrderStatus oldStatus;
    private OrderStatus newStatus;

    public OrderStatusHistoryDTO() {
    }

    public OrderStatusHistoryDTO(Integer historyId, Integer orderId, LocalDateTime changedAt,
                                 OrderStatus oldStatus, OrderStatus newStatus) {
        this.historyId = historyId;
        this.orderId = orderId;
        this.changedAt = changedAt;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }

    public Integer getHistoryId() { return historyId; }
    public void setHistoryId(Integer historyId) { this.historyId = historyId; }
    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
    public OrderStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(OrderStatus oldStatus) { this.oldStatus = oldStatus; }
    public OrderStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OrderStatus newStatus) { this.newStatus = newStatus; }
}
