package com.tidbits.controller;

import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.Account;
import com.tidbits.service.AccountService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
@AutoConfigureMockMvc(addFilters = false)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccountService accountService;

    @Test
    void createAccount_returnsCreatedDtoWhenRequestIsValid() throws Exception {
        Account saved = account(10, 42, "Primary", 0.0);
        when(accountService.createAccount("Primary", 42)).thenReturn(saved);

        mockMvc.perform(post("/api/users/{userId}/accounts", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("Primary"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountId").value(10))
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.nickname").value("Primary"))
                .andExpect(jsonPath("$.cashBalance").value(0.0));

        verify(accountService).createAccount("Primary", 42);
    }

    @Test
    void createAccount_returnsBadRequestWhenNicknameIsBlank() throws Exception {
        mockMvc.perform(post("/api/users/{userId}/accounts", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("Account nickname is required."))
                .andExpect(jsonPath("$.status").value(400));

        verify(accountService, never()).createAccount(org.mockito.ArgumentMatchers.anyString(), anyInt());
    }

    @Test
    void createAccount_returnsForbiddenWhenServiceDeniesAccess() throws Exception {
        when(accountService.createAccount("Primary", 42))
                .thenThrow(new AccessDeniedException("Unauthorized access."));

        mockMvc.perform(post("/api/users/{userId}/accounts", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("Primary"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"))
                .andExpect(jsonPath("$.message").value("Unauthorized access."))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void getAccountById_returnsAccountForUser() throws Exception {
        when(accountService.getAccountByIdForUser(42, 10)).thenReturn(account(10, 42, "Main", 120.5));

        mockMvc.perform(get("/api/users/{userId}/accounts/{id}", 42, 10))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId").value(10))
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.nickname").value("Main"))
                .andExpect(jsonPath("$.cashBalance").value(120.5));
    }

    @Test
    void getAccountById_returnsNotFoundWhenServiceCannotFindAccount() throws Exception {
        when(accountService.getAccountByIdForUser(42, 10))
                .thenThrow(new ResourceNotFoundException("Account 10 not found for user 42."));

        mockMvc.perform(get("/api/users/{userId}/accounts/{id}", 42, 10))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Account 10 not found for user 42."))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getAllAccountsByUser_returnsMappedDtos() throws Exception {
        when(accountService.getAccountsByUserId(42)).thenReturn(List.of(
                account(1, 42, "Main", 100.0),
                account(2, 42, "Savings", 250.0)
        ));

        mockMvc.perform(get("/api/users/{userId}/accounts", 42))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accountId").value(1))
                .andExpect(jsonPath("$[0].nickname").value("Main"))
                .andExpect(jsonPath("$[1].accountId").value(2))
                .andExpect(jsonPath("$[1].nickname").value("Savings"));
    }

    @Test
    void updateAccount_returnsAcceptedWhenValid() throws Exception {
        when(accountService.updateAccount(42, 10, "Updated"))
                .thenReturn(account(10, 42, "Updated", 300.0));

        mockMvc.perform(put("/api/users/{userId}/accounts/{id}", 42, 10)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("Updated"))
                .andExpect(status().isAccepted());

        verify(accountService).updateAccount(42, 10, "Updated");
    }

    @Test
    void updateAccount_returnsBadRequestWhenNicknameIsBlank() throws Exception {
        mockMvc.perform(put("/api/users/{userId}/accounts/{id}", 42, 10)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content(" \t "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("New account nickname is required."))
                .andExpect(jsonPath("$.status").value(400));

        verify(accountService, never()).updateAccount(eq(42), eq(10), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void updateAccount_returnsNotFoundWhenServiceCannotFindAccount() throws Exception {
        when(accountService.updateAccount(42, 10, "Updated"))
                .thenThrow(new ResourceNotFoundException("Account 10 not found for user 42."));

        mockMvc.perform(put("/api/users/{userId}/accounts/{id}", 42, 10)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("Updated"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteAccount_returnsNoContentWhenDeletionSucceeds() throws Exception {
        doNothing().when(accountService).deleteAccount(42, 10);

        mockMvc.perform(delete("/api/users/{userId}/accounts/{id}", 42, 10))
                .andExpect(status().isNoContent());

        verify(accountService).deleteAccount(42, 10);
    }

    @Test
    void deleteAccount_returnsForbiddenWhenServiceDeniesAccess() throws Exception {
        doThrow(new AccessDeniedException("Unauthorized access."))
                .when(accountService).deleteAccount(42, 10);

        mockMvc.perform(delete("/api/users/{userId}/accounts/{id}", 42, 10))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"))
                .andExpect(jsonPath("$.message").value("Unauthorized access."))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void createAccount_returnsServerErrorForUnexpectedRuntimeException() throws Exception {
        when(accountService.createAccount("Primary", 42))
                .thenThrow(new RuntimeException("unexpected"));

        mockMvc.perform(post("/api/users/{userId}/accounts", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("Primary"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errorCode").value("GENERIC_ERROR"))
                .andExpect(jsonPath("$.message").value("unexpected"))
                .andExpect(jsonPath("$.status").value(500));
    }

    private Account account(Integer accountId, Integer userId, String nickname, Double balance) {
        return new Account(accountId, userId, nickname, balance, LocalDateTime.now());
    }
}

