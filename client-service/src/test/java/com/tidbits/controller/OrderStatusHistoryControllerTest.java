package com.tidbits.controller;

import com.tidbits.model.entity.OrderStatusHistory;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.service.OrderStatusHistoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderStatusHistoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class OrderStatusHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderStatusHistoryService orderStatusHistoryService;

    @Test
    void getAllOrderStatusHistories_returnsMappedHistory() throws Exception {
        when(orderStatusHistoryService.getHistoryByOrderId(88)).thenReturn(List.of(
                history(1, 88, OrderStatus.PLACED, OrderStatus.ACCEPTED),
                history(2, 88, OrderStatus.ACCEPTED, OrderStatus.FILLED)
        ));

        mockMvc.perform(get("/api/orders/{orderId}/history", 88))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].historyId").value(1))
                .andExpect(jsonPath("$[0].oldStatus").value("PLACED"))
                .andExpect(jsonPath("$[1].newStatus").value("FILLED"));
    }

    @Test
    void getAllOrderStatusHistories_returnsEmptyListWhenNoHistory() throws Exception {
        when(orderStatusHistoryService.getHistoryByOrderId(88)).thenReturn(List.of());

        mockMvc.perform(get("/api/orders/{orderId}/history", 88))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    private OrderStatusHistory history(Integer historyId, Integer orderId, OrderStatus oldStatus, OrderStatus newStatus) {
        return new OrderStatusHistory(historyId, orderId, LocalDateTime.now(), oldStatus, newStatus);
    }
}
