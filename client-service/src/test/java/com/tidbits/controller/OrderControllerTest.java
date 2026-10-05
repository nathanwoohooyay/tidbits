package com.tidbits.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.model.dto.OrderResponseDTO;
import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.OrderStatus;
import com.tidbits.model.enums.OrderType;
import com.tidbits.service.OrderService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@AutoConfigureMockMvc(addFilters = false)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    void requestOrder_setsAccountFromPathAndReturnsMappedResponse() throws Exception {
        Order saved = order(42, 2, 10.0, 100.0, OrderType.BUY, OrderStatus.PLACED);
        saved.setOrderId(501);

        OrderResponseDTO response = new OrderResponseDTO();
        response.setOrderId(501);
        response.setQuantity(10.0);
        response.setPrice(100.0);
        response.setOrderType("BUY");
        response.setStatus("PLACED");

        when(orderService.requestOrder(any(Order.class))).thenReturn(saved);
        when(orderService.toResponseDto(saved)).thenReturn(response);

        mockMvc.perform(post("/api/accounts/{accountId}/orders", 42)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "instrumentId": 2,
                                  "quantity": 10,
                                  "stockPrice": 100,
                                  "orderType": "BUY"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.orderId").value(501))
                .andExpect(jsonPath("$.status").value("PLACED"));

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderService).requestOrder(orderCaptor.capture());
        assertEquals(42, orderCaptor.getValue().getAccountId());
    }

    @Test
    void getAllOrdersByAccountId_returnsOrderResponses() throws Exception {
        Order order = order(42, 2, 10.0, 100.0, OrderType.BUY, OrderStatus.PLACED);
        order.setOrderId(501);

        OrderResponseDTO response = new OrderResponseDTO();
        response.setOrderId(501);
        response.setQuantity(10.0);
        response.setPrice(100.0);
        response.setOrderType("BUY");
        response.setStatus("PLACED");

        when(orderService.getOrdersByAccountId(42)).thenReturn(List.of(order));
        when(orderService.toResponseDtoList(List.of(order))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/accounts/{accountId}/orders", 42))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value(501))
                .andExpect(jsonPath("$[0].orderType").value("BUY"));
    }

    @Test
    void getOrderById_returnsMappedResponse() throws Exception {
        Order order = order(42, 2, 10.0, 100.0, OrderType.BUY, OrderStatus.PLACED);
        order.setOrderId(501);

        OrderResponseDTO response = new OrderResponseDTO();
        response.setOrderId(501);
        response.setOrderType("BUY");
        response.setStatus("PLACED");

        when(orderService.getOrderByIdForAccount(42, 501)).thenReturn(order);
        when(orderService.toResponseDto(order)).thenReturn(response);

        mockMvc.perform(get("/api/accounts/{accountId}/orders/{orderId}", 42, 501))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(501))
                .andExpect(jsonPath("$.orderType").value("BUY"))
            .andExpect(jsonPath("$.status").value("PLACED"));
    }

    private Order order(Integer accountId, Integer instrumentId, Double quantity, Double price,
                        OrderType orderType, OrderStatus status) {
        Order order = new Order();
        order.setAccountId(accountId);
        order.setInstrumentId(instrumentId);
        order.setQuantity(quantity);
        order.setStockPrice(price);
        order.setOrderType(orderType);
        order.setStatus(status);
        return order;
    }
}
