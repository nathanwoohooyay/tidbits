package com.tidbits.model.dto;

public class OrderStatusUpdateRequestDTO {
    private String status;

    public OrderStatusUpdateRequestDTO() {
    }

    public OrderStatusUpdateRequestDTO(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
