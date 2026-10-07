package com.tidbits.controller;

import com.tidbits.model.dto.OrderStatusHistoryDTO;
import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.service.OrderStatusHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders/{orderId}/history")
public class OrderStatusHistoryController {

    @Autowired
    private OrderStatusHistoryService orderStatusHistoryService;

    @GetMapping
    public ResponseEntity<List<OrderStatusHistoryDTO>> getAllOrderStatusHistories(@PathVariable Integer orderId) {
        List<OrderStatusHistoryDTO> history = orderStatusHistoryService.getHistoryByOrderId(orderId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(history);
    }

    private OrderStatusHistoryDTO toDto(OrderStatusHistory history) {
        OrderStatusHistoryDTO dto = new OrderStatusHistoryDTO();
        dto.setHistoryId(history.getHistoryId());
        dto.setChangedAt(history.getChangedAt());
        dto.setOldStatus(history.getOldStatus());
        dto.setNewStatus(history.getNewStatus());
        return dto;
    }
}
