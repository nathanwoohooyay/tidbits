package com.tidbits.controller;

import com.tidbits.model.entity.AccountHolding;
import com.tidbits.service.AccountHoldingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountHoldingController.class)
@AutoConfigureMockMvc(addFilters = false)
class AccountHoldingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccountHoldingService accountHoldingService;

    @Test
    void getAccountHoldingById_returnsHoldingForAccount() throws Exception {
        AccountHolding holding = holding(7, 42, 3, 10.5, 1500.0);
        when(accountHoldingService.getAccountHoldingById(7)).thenReturn(Optional.of(holding));

        mockMvc.perform(get("/api/accounts/{accountId}/holdings/{holdingId}", 42, 7))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.holdingId").value(7))
                .andExpect(jsonPath("$.instrumentId").value(3))
                .andExpect(jsonPath("$.quantity").value(10.5))
                .andExpect(jsonPath("$.amountInvested").value(1500.0));

        verify(accountHoldingService).getAccountHoldingById(7);
    }

    @Test
    void getAccountHoldingById_returnsNotFoundWhenHoldingIsMissing() throws Exception {
        when(accountHoldingService.getAccountHoldingById(7)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/accounts/{accountId}/holdings/{holdingId}", 42, 7))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Holding 7 not found for account 42."))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getAllAccountHoldings_returnsHoldingsForAccount() throws Exception {
        when(accountHoldingService.getAllAccountHoldingsByAccountId(42)).thenReturn(List.of(
                holding(7, 42, 3, 10.5, 1500.0),
                holding(8, 42, 9, 1.0, 250.0)
        ));

        mockMvc.perform(get("/api/accounts/{accountId}/holdings/", 42))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].holdingId").value(7))
                .andExpect(jsonPath("$[0].instrumentId").value(3))
                .andExpect(jsonPath("$[1].holdingId").value(8))
                .andExpect(jsonPath("$[1].instrumentId").value(9));
    }

    private AccountHolding holding(Integer holdingId, Integer accountId, Integer instrumentId,
                                   Double quantity, Double amountInvested) {
        return new AccountHolding(holdingId, accountId, instrumentId, quantity, amountInvested, LocalDateTime.now());
    }
}