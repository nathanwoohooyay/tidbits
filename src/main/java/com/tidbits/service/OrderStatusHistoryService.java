package com.tidbits.service;

import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.repository.OrderStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderStatusHistoryService {

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    public OrderStatusHistory createOrderStatusHistory(OrderStatusHistory orderStatusHistory) {
        return null;
    }

    public Optional<OrderStatusHistory> getOrderStatusHistoryById(Integer historyId) {
        return Optional.empty();
    }

    public List<OrderStatusHistory> getHistoryByOrderId(Integer orderId) {
        return List.of();
    }

    public List<OrderStatusHistory> getAllOrderStatusHistories() {
        return List.of();
    }

    public OrderStatusHistory updateOrderStatusHistory(Integer historyId, OrderStatusHistory orderStatusHistory) {
        return null;
    }

    public void deleteOrderStatusHistory(Integer historyId) {
    }
}
