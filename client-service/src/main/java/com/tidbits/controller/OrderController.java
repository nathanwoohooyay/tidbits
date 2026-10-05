package com.tidbits.controller;

import com.tidbits.exception.BadRequestException;
import com.tidbits.model.dto.OrderStatusUpdateRequestDTO;
import com.tidbits.model.dto.OrderResponseDTO;
import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.OrderStatus;
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
    public ResponseEntity<OrderResponseDTO> requestOrder(@RequestBody Order order, @PathVariable Integer accountId) {
        order.setAccountId(accountId);
        Order requestedOrder = orderService.requestOrder(order);
        return ResponseEntity.accepted().body(orderService.toResponseDto(requestedOrder));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Integer orderId, @PathVariable Integer accountId) {
        Order order = orderService.getOrderByIdForAccount(accountId, orderId);
        return ResponseEntity.ok(orderService.toResponseDto(order));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getAllOrdersByAccountId(@PathVariable Integer accountId) {
        List<Order> orders = orderService.getOrdersByAccountId(accountId);
        return ResponseEntity.ok(orderService.toResponseDtoList(orders));
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(@PathVariable Integer accountId,
                                                               @PathVariable Integer orderId,
                                                               @RequestBody OrderStatusUpdateRequestDTO request) {
        if (request == null || request.getStatus() == null || request.getStatus().isBlank()) {
            throw new BadRequestException("Order status is required.");
        }

        OrderStatus status;
        try {
            status = OrderStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported order status: " + request.getStatus());
        }

        Order updatedOrder = orderService.updateOrderStatus(accountId, orderId, status);
        return ResponseEntity.ok(orderService.toResponseDto(updatedOrder));
    }
}
