package com.tidbits.controller;

import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.model.enums.TransactionType;
import com.tidbits.service.AccountTransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountTransactionController.class)
@AutoConfigureMockMvc(addFilters = false)
class AccountTransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccountTransactionService accountTransactionService;

    @Test
    void depositTransaction_returnsMappedTransaction() throws Exception {
        when(accountTransactionService.depositCash(42, 120.50)).thenReturn(
                tx(10, 42, 120.50, TransactionType.DEPOSIT)
        );

        mockMvc.perform(post("/api/accounts/{accountId}/deposit", 42)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("120.5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value(10))
                .andExpect(jsonPath("$.amount").value(120.5))
                .andExpect(jsonPath("$.transactionType").value("DEPOSIT"));

        verify(accountTransactionService).depositCash(42, 120.50);
    }

    @Test
    void withdrawTransaction_returnsMappedTransaction() throws Exception {
        when(accountTransactionService.withdrawCash(42, 25.25)).thenReturn(
                tx(11, 42, 25.25, TransactionType.WITHDRAW)
        );

        mockMvc.perform(post("/api/accounts/{accountId}/withdraw", 42)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("25.25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value(11))
                .andExpect(jsonPath("$.transactionType").value("WITHDRAW"));

        verify(accountTransactionService).withdrawCash(42, 25.25);
    }

    @Test
    void getAccountTransactionById_returnsTransactionWhenOwnedByAccount() throws Exception {
        when(accountTransactionService.getAccountTransactionById(7)).thenReturn(
                Optional.of(tx(7, 42, 50.0, TransactionType.DEPOSIT))
        );

        mockMvc.perform(get("/api/accounts/{accountId}/transactions/{transactionId}", 42, 7))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value(7));
    }

    @Test
    void getAccountTransactionById_returnsNotFoundWhenTransactionMissing() throws Exception {
        when(accountTransactionService.getAccountTransactionById(7)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/accounts/{accountId}/transactions/{transactionId}", 42, 7))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Transaction 7 not found."));
    }

    @Test
    void getAccountTransactionById_returnsNotFoundWhenTransactionBelongsToAnotherAccount() throws Exception {
        when(accountTransactionService.getAccountTransactionById(7)).thenReturn(
                Optional.of(tx(7, 99, 50.0, TransactionType.DEPOSIT))
        );

        mockMvc.perform(get("/api/accounts/{accountId}/transactions/{transactionId}", 42, 7))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Transaction 7 not found for account 42."));
    }

    @Test
    void getAccountTransactions_returnsMappedTransactions() throws Exception {
        when(accountTransactionService.getAllTransactionsByAccountId(42)).thenReturn(List.of(
                tx(1, 42, 10.0, TransactionType.DEPOSIT),
                tx(2, 42, 4.0, TransactionType.WITHDRAW)
        ));

        mockMvc.perform(get("/api/accounts/{accountId}/transactions", 42))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].transactionId").value(1))
                .andExpect(jsonPath("$[1].transactionId").value(2));
    }

    private AccountTransaction tx(Integer transactionId, Integer accountId, Double amount, TransactionType type) {
        return new AccountTransaction(transactionId, accountId, null, amount, type, LocalDateTime.now());
    }
}
