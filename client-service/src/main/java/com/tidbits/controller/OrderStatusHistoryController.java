package com.tidbits.controller;

import com.tidbits.model.dto.OrderStatusHistoryDTO;
import com.tidbits.service.OrderStatusHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders/{orderId}/history")
public class OrderStatusHistoryController {

    @Autowired
    private OrderStatusHistoryService orderStatusHistoryService;

    @GetMapping
    public ResponseEntity<List<OrderStatusHistoryDTO>> getAllOrderStatusHistories(@PathVariable Integer orderId) {
        return ResponseEntity.ok(List.of());
    }
}
