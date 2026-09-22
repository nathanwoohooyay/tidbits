package com.tidbits.controller;

import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.service.OrderStatusHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order-status-histories")
public class OrderStatusHistoryController {

    @Autowired
    private OrderStatusHistoryService orderStatusHistoryService;

    @PostMapping
    public ResponseEntity<OrderStatusHistory> createOrderStatusHistory(@RequestBody OrderStatusHistory orderStatusHistory) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderStatusHistory> getOrderStatusHistoryById(@PathVariable Integer id) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<OrderStatusHistory>> getAllOrderStatusHistories() {
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderStatusHistory> updateOrderStatusHistory(@PathVariable Integer id, @RequestBody OrderStatusHistory orderStatusHistory) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrderStatusHistory(@PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }
}
