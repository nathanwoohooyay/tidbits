package com.tidbits.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public class OrderResponseDTO {
    private Integer orderId;
    private Integer quantity;
    private Double price;
    private String orderType;
    private String status;
    private InstrumentDTO instrument;
    private List<OrderStatusHistoryDTO> statusHistory;

    public OrderResponseDTO() {
    }

    public OrderResponseDTO(Integer orderId, Integer quantity, Double price,
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
}
