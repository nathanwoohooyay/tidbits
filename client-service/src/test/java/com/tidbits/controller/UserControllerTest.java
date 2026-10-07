package com.tidbits.controller;

import com.tidbits.exception.BadRequestException;
import com.tidbits.model.entity.User;
import com.tidbits.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void getUserById_returnsUserDtoWhenFound() throws Exception {
        User user = user(42, "alice", "alice@example.com", "1112223333");
        when(userService.getUserById(42)).thenReturn(java.util.Optional.of(user));

        mockMvc.perform(get("/api/users/{userId}", 42))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.phoneNumber").value("1112223333"));
    }

    @Test
    void changeEmail_returnsUpdatedUserWhenInputIsValid() throws Exception {
        User updated = user(42, "alice", "new@example.com", "1112223333");
        when(userService.changeEmail(42, "new@example.com")).thenReturn(updated);

        mockMvc.perform(patch("/api/users/{userId}/change-email", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("new@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.email").value("new@example.com"));

        verify(userService).changeEmail(42, "new@example.com");
    }

    @Test
    void changeEmail_returnsBadRequestWhenServiceRejectsInput() throws Exception {
        when(userService.changeEmail(42, "   "))
                .thenThrow(new BadRequestException("New email is required."));

        mockMvc.perform(patch("/api/users/{userId}/change-email", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("   "))
                .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("New email is required."))
        .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void changePhoneNumber_returnsUpdatedUserWhenInputIsValid() throws Exception {
        User updated = user(42, "alice", "alice@example.com", "9998887777");
        when(userService.changePhoneNumber(42, "9998887777")).thenReturn(updated);

        mockMvc.perform(patch("/api/users/{userId}/change-phone-number", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("9998887777"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.phoneNumber").value("9998887777"));

        verify(userService).changePhoneNumber(42, "9998887777");
    }

    @Test
    void changePhoneNumber_returnsBadRequestWhenServiceRejectsInput() throws Exception {
        when(userService.changePhoneNumber(42, " "))
                .thenThrow(new BadRequestException("New phone number is required."));

        mockMvc.perform(patch("/api/users/{userId}/change-phone-number", 42)
                        .contentType(MediaType.TEXT_PLAIN)
                .content(" "))
                .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
            .andExpect(jsonPath("$.message").value("New phone number is required."))
            .andExpect(jsonPath("$.status").value(400));
    }

    private User user(Integer userId, String username, String email, String phoneNumber) {
        User user = new User();
        user.setUserId(userId);
        user.setRoleId(1);
        user.setUsername(username);
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);
        user.setRewardPoints(0);
        user.setDateOfBirth(LocalDate.of(1990, 1, 1));
        user.setCreatedAt(LocalDateTime.now());
        user.setLastLogin(LocalDateTime.now());
        user.setTokenVersion(0);
        user.setPasswordHash("hash");
        return user;
    }
}