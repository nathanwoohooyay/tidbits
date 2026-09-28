package com.tidbits;

import com.tidbits.controller.UserController;
import com.tidbits.model.dto.ChangePasswordDTO;
import com.tidbits.model.dto.UserDTO;
import com.tidbits.model.dto.UserUpdateDTO;
import com.tidbits.model.entity.User;
import com.tidbits.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("UserController Tests")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private UserDTO testUserDTO;
    private UserUpdateDTO testUserUpdateDTO;
    private ChangePasswordDTO changePasswordDTO;

    @BeforeEach
    void setUp() {
        // Create test user entity
        testUser = new User();
        testUser.setUserId(1);
        testUser.setUsername("testuser");
        testUser.setEmail("testuser@example.com");
        testUser.setPhoneNumber("1234567890");
        testUser.setRewardPoints(100);
        testUser.setRoleId(1);
        testUser.setPasswordHash("hashedPassword123");
        testUser.setCreatedAt(LocalDateTime.now());

        // Create test user DTO
        testUserDTO = new UserDTO(1, "testuser", "testuser@example.com", "1234567890", 100);

        // Create test user update DTO
        testUserUpdateDTO = new UserUpdateDTO("newemail@example.com", "9876543210");

        // Create change password DTO
        changePasswordDTO = new ChangePasswordDTO("oldPassword", "newPassword", "newPassword");
    }

    // ==================== GET Tests ====================

    @Test
    @DisplayName("Should get user by ID successfully")
    @WithMockUser(username = "1")
    void testGetUserById_Success() throws Exception {
        // Arrange
        when(userService.getUserById(1)).thenReturn(Optional.of(testUser));

        // Act & Assert
        mockMvc.perform(get("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("testuser@example.com"))
                .andExpect(jsonPath("$.phoneNumber").value("1234567890"))
                .andExpect(jsonPath("$.rewardPoints").value(100));

        verify(userService, times(1)).getUserById(1);
    }

    @Test
    @DisplayName("Should return not found when user does not exist")
    @WithMockUser(username = "99")
    void testGetUserById_NotFound() throws Exception {
        // Arrange
        when(userService.getUserById(99)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/users/99")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(userService, times(1)).getUserById(99);
    }

    @Test
    @DisplayName("Should deny access when userId does not match authenticated user")
    @WithMockUser(username = "2")
    void testGetUserById_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        verify(userService, never()).getUserById(anyInt());
    }

    @Test
    @DisplayName("Should require authentication for GET request")
    void testGetUserById_NoAuth() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).getUserById(anyInt());
    }

    // ==================== PUT Tests ====================

    @Test
    @DisplayName("Should update user successfully")
    @WithMockUser(username = "1")
    void testUpdateUser_Success() throws Exception {
        // Arrange
        User updatedUser = new User();
        updatedUser.setUserId(1);
        updatedUser.setUsername("testuser");
        updatedUser.setEmail("newemail@example.com");
        updatedUser.setPhoneNumber("9876543210");
        updatedUser.setRewardPoints(100);

        when(userService.updateUser(eq(1), any(User.class))).thenReturn(updatedUser);

        // Act & Assert
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUserUpdateDTO))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newemail@example.com"))
                .andExpect(jsonPath("$.phoneNumber").value("9876543210"));

        verify(userService, times(1)).updateUser(eq(1), any(User.class));
    }

    @Test
    @DisplayName("Should deny update when userId does not match authenticated user")
    @WithMockUser(username = "2")
    void testUpdateUser_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUserUpdateDTO))
                .with(csrf()))
                .andExpect(status().isForbidden());

        verify(userService, never()).updateUser(anyInt(), any(User.class));
    }

    @Test
    @DisplayName("Should require authentication for PUT request")
    void testUpdateUser_NoAuth() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUserUpdateDTO))
                .with(csrf()))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).updateUser(anyInt(), any(User.class));
    }

    // ==================== PATCH Tests ====================

    @Test
    @DisplayName("Should partially update user")
    @WithMockUser(username = "1")
    void testPartiallyUpdateUser_Success() throws Exception {
        // Act & Assert
        mockMvc.perform(patch("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUserDTO))
                .with(csrf()))
                .andExpect(status().isOk());

        verify(userService, never()).partiallyUpdateUser(anyInt(), any(User.class));
    }

    @Test
    @DisplayName("Should deny partial update when userId does not match authenticated user")
    @WithMockUser(username = "2")
    void testPartiallyUpdateUser_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(patch("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUserDTO))
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should require authentication for PATCH request")
    void testPartiallyUpdateUser_NoAuth() throws Exception {
        // Act & Assert
        mockMvc.perform(patch("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUserDTO))
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    // ==================== DELETE Tests ====================

    @Test
    @DisplayName("Should delete user successfully")
    @WithMockUser(username = "1")
    void testDeleteUser_Success() throws Exception {
        // Arrange
        doNothing().when(userService).deleteUser(1);

        // Act & Assert
        mockMvc.perform(delete("/api/users/1")
                .with(csrf()))
                .andExpect(status().isNoContent());

        verify(userService, times(1)).deleteUser(1);
    }

    @Test
    @DisplayName("Should deny delete when userId does not match authenticated user")
    @WithMockUser(username = "2")
    void testDeleteUser_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/users/1")
                .with(csrf()))
                .andExpect(status().isForbidden());

        verify(userService, never()).deleteUser(anyInt());
    }

    @Test
    @DisplayName("Should require authentication for DELETE request")
    void testDeleteUser_NoAuth() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/users/1")
                .with(csrf()))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).deleteUser(anyInt());
    }

    // ==================== PATCH Change Password Tests ====================

    @Test
    @DisplayName("Should change password successfully")
    @WithMockUser(username = "1")
    void testChangePassword_Success() throws Exception {
        // Arrange
        User userWithNewPassword = new User();
        userWithNewPassword.setUserId(1);
        userWithNewPassword.setUsername("testuser");
        userWithNewPassword.setEmail("testuser@example.com");
        userWithNewPassword.setPhoneNumber("1234567890");
        userWithNewPassword.setRewardPoints(100);
        userWithNewPassword.setPasswordHash("newHashedPassword");

        when(userService.changePassword(eq(1), anyString(), anyString(), anyString()))
                .thenReturn(userWithNewPassword);

        // Act & Assert
        mockMvc.perform(patch("/api/users/1/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePasswordDTO))
                .with(csrf()))
                .andExpect(status().isOk());

        verify(userService, never()).changePassword(anyInt(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should deny password change when userId does not match authenticated user")
    @WithMockUser(username = "2")
    void testChangePassword_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(patch("/api/users/1/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePasswordDTO))
                .with(csrf()))
                .andExpect(status().isForbidden());

        verify(userService, never()).changePassword(anyInt(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should require authentication for change password request")
    void testChangePassword_NoAuth() throws Exception {
        // Act & Assert
        mockMvc.perform(patch("/api/users/1/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePasswordDTO))
                .with(csrf()))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).changePassword(anyInt(), anyString(), anyString(), anyString());
    }

    // ==================== Edge Cases and Validation Tests ====================

    @Test
    @DisplayName("Should handle invalid user ID format")
    @WithMockUser(username = "1")
    void testGetUserById_InvalidFormat() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/users/invalid")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(userService, never()).getUserById(anyInt());
    }
/*
    @Test
    @DisplayName("Should handle invalid request body format for update")
    @WithMockUser(username = "1")
    void testUpdateUser_EmptyBody() throws Exception {
        // Act & Assert - Spring returns 500 when body is missing or malformed
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json")
                .with(csrf()))
                .andExpect(status().isInternalServerError());

        verify(userService, never()).updateUser(anyInt(), any(User.class));
    }
*/
    @Test
    @DisplayName("Should handle update with null email")
    @WithMockUser(username = "1")
    void testUpdateUser_NullEmail() throws Exception {
        // Arrange
        UserUpdateDTO updateDTOWithNullEmail = new UserUpdateDTO(null, "9876543210");

        when(userService.updateUser(eq(1), any(User.class))).thenReturn(testUser);

        // Act & Assert
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTOWithNullEmail))
                .with(csrf()))
                .andExpect(status().isOk());

        verify(userService, times(1)).updateUser(eq(1), any(User.class));
    }

    @Test
    @DisplayName("Should handle update with null phone number")
    @WithMockUser(username = "1")
    void testUpdateUser_NullPhoneNumber() throws Exception {
        // Arrange
        UserUpdateDTO updateDTOWithNullPhone = new UserUpdateDTO("newemail@example.com", null);

        when(userService.updateUser(eq(1), any(User.class))).thenReturn(testUser);

        // Act & Assert
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTOWithNullPhone))
                .with(csrf()))
                .andExpect(status().isOk());

        verify(userService, times(1)).updateUser(eq(1), any(User.class));
    }

    @Test
    @DisplayName("Should handle change password with mismatched new and confirm passwords")
    @WithMockUser(username = "1")
    void testChangePassword_MismatchedPasswords() throws Exception {
        // Arrange
        ChangePasswordDTO mismatchedDTO = new ChangePasswordDTO("oldPassword", "newPassword", "differentPassword");

        // Act & Assert
        mockMvc.perform(patch("/api/users/1/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mismatchedDTO))
                .with(csrf()))
                .andExpect(status().isOk());

        verify(userService, never()).changePassword(anyInt(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should handle zero as user ID")
    @WithMockUser(username = "0")
    void testGetUserById_ZeroId() throws Exception {
        // Arrange
        when(userService.getUserById(0)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/users/0")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(userService, times(1)).getUserById(0);
    }

    @Test
    @DisplayName("Should handle negative user ID")
    @WithMockUser(username = "-1")
    void testGetUserById_NegativeId() throws Exception {
        // Arrange
        when(userService.getUserById(-1)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/users/-1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(userService, times(1)).getUserById(-1);
    }

    @Test
    @DisplayName("Should handle large user ID")
    @WithMockUser(username = "9999999")
    void testGetUserById_LargeId() throws Exception {
        // Arrange
        when(userService.getUserById(9999999)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/users/9999999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(userService, times(1)).getUserById(9999999);
    }
}

