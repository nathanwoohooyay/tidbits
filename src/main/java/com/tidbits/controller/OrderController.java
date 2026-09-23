package com.tidbits.controller;

import com.tidbits.model.entity.Order;
import com.tidbits.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts/{accountId}/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order, @PathVariable Integer accountId) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(@PathVariable Integer orderId, @PathVariable Integer accountId) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrdersByAccountId(@PathVariable Integer accountId) {
        return ResponseEntity.ok(List.of());
    }
}
