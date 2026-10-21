package com.tidbits.service;

import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.Order;
import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.repository.OrderStatusHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderStatusHistoryServiceTest {

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @InjectMocks
    private OrderStatusHistoryService orderStatusHistoryService;

    @Test
    void switchStatus_updatesOrderAndCreatesHistoryRow() {
        Order order = new Order(22, 42, 3, 1.0, 10.0, OrderType.BUY, OrderStatus.PLACED);

        orderStatusHistoryService.switchStatus(order, OrderStatus.PLACED, OrderStatus.ACCEPTED);

        assertEquals(OrderStatus.ACCEPTED, order.getStatus());

        ArgumentCaptor<OrderStatusHistory> captor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository).save(captor.capture());
        OrderStatusHistory saved = captor.getValue();
        assertEquals(22, saved.getOrderId());
        assertEquals(OrderStatus.PLACED, saved.getOldStatus());
        assertEquals(OrderStatus.ACCEPTED, saved.getNewStatus());
        assertNotNull(saved.getChangedAt());
    }

    @Test
    void getHistoryByOrderId_returnsRepositoryResult() {
        List<OrderStatusHistory> history = List.of(
                new OrderStatusHistory(1, 22, LocalDateTime.now(), OrderStatus.PLACED, OrderStatus.ACCEPTED)
        );
        when(orderStatusHistoryRepository.findByOrderId(22)).thenReturn(history);

        List<OrderStatusHistory> result = orderStatusHistoryService.getHistoryByOrderId(22);

        assertSame(history, result);
    }

    @Test
    void updateOrderStatusHistory_updatesFieldsWhenFound() {
        OrderStatusHistory existing = new OrderStatusHistory(1, 22, LocalDateTime.now(), OrderStatus.PLACED, OrderStatus.ACCEPTED);
        OrderStatusHistory update = new OrderStatusHistory(null, 22, LocalDateTime.now().plusHours(1), OrderStatus.ACCEPTED, OrderStatus.FILLED);

        when(orderStatusHistoryRepository.findById(1)).thenReturn(Optional.of(existing));
        when(orderStatusHistoryRepository.save(existing)).thenReturn(existing);

        OrderStatusHistory result = orderStatusHistoryService.updateOrderStatusHistory(1, update);

        assertSame(existing, result);
        assertEquals(OrderStatus.ACCEPTED, existing.getOldStatus());
        assertEquals(OrderStatus.FILLED, existing.getNewStatus());
        assertEquals(update.getChangedAt(), existing.getChangedAt());
    }

    @Test
    void updateOrderStatusHistory_throwsWhenMissing() {
        when(orderStatusHistoryRepository.findById(1)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> orderStatusHistoryService.updateOrderStatusHistory(1, new OrderStatusHistory())
        );

        assertEquals("Order status history 1 not found.", ex.getMessage());
    }

    @Test
    void deleteOrderStatusHistory_deletesById() {
        orderStatusHistoryService.deleteOrderStatusHistory(1);

        verify(orderStatusHistoryRepository).deleteById(1);
    }
}
