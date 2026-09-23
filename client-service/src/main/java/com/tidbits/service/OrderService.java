package com.tidbits.service;

import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    public Order createOrder(Order order) {
        return null;
    }

    public Optional<Order> getOrderById(Integer orderId) {
        return Optional.empty();
    }

    public List<Order> getOrdersByAccountId(Integer accountId) {
        return List.of();
    }

    public List<Order> getOrdersByStatus(OrderStatus status) {
        return List.of();
    }

    public List<Order> getAllOrders() {
        return List.of();
    }

    public Order updateOrder(Integer orderId, Order order) {
        return null;
    }

    public void deleteOrder(Integer orderId) {
    }
}
