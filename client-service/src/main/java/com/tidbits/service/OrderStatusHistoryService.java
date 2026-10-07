package com.tidbits.service;

import com.tidbits.exception.ResourceNotFoundException;
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
        return orderStatusHistoryRepository.save(orderStatusHistory);
    }

    public Optional<OrderStatusHistory> getOrderStatusHistoryById(Integer historyId) {
        return orderStatusHistoryRepository.findById(historyId);
    }

    public List<OrderStatusHistory> getHistoryByOrderId(Integer orderId) {
        return orderStatusHistoryRepository.findByOrderId(orderId);
    }

    public List<OrderStatusHistory> getAllOrderStatusHistories() {
        return orderStatusHistoryRepository.findAll();
    }

    public OrderStatusHistory updateOrderStatusHistory(Integer historyId, OrderStatusHistory orderStatusHistory) {
        OrderStatusHistory existing = orderStatusHistoryRepository.findById(historyId)
                .orElseThrow(() -> new ResourceNotFoundException("Order status history " + historyId + " not found."));

        existing.setChangedAt(orderStatusHistory.getChangedAt());
        existing.setOldStatus(orderStatusHistory.getOldStatus());
        existing.setNewStatus(orderStatusHistory.getNewStatus());
        return orderStatusHistoryRepository.save(existing);
    }

    public void deleteOrderStatusHistory(Integer historyId) {
        orderStatusHistoryRepository.deleteById(historyId);
    }
}
