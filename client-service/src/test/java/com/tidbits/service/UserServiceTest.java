package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.User;
import com.tidbits.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserAuditEventPublisher userAuditEventPublisher;

    @InjectMocks
    private UserService userService;

    @Test
    void changeEmail_updatesEmailAndPublishesSuccessEvent() {
        User user = user(42, "alice@example.com", "1112223333");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.changeEmail(42, "new@example.com");

        assertSame(user, result);
        assertEquals("new@example.com", user.getEmail());
        verify(userRepository).save(user);
        verify(userAuditEventPublisher).publish("CHANGE_EMAIL", 42, "SUCCESS", "Email changed");
    }

    @Test
    void changeEmail_rejectsBlankEmailAndPublishesFailureEvent() {
        User user = user(42, "alice@example.com", "1112223333");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> userService.changeEmail(42, "   "));

        assertEquals("New email is required.", ex.getMessage());
        verify(userRepository, never()).save(user);
        verify(userAuditEventPublisher).publish("CHANGE_EMAIL", 42, "FAILURE", "New email is required.");
    }

    @Test
    void changeEmail_throwsNotFoundWhenUserIsMissing() {
        when(userRepository.findById(42)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.changeEmail(42, "new@example.com")
        );

        assertEquals("User 42 not found.", ex.getMessage());
        verify(userAuditEventPublisher, never()).publish(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void changePhoneNumber_updatesPhoneAndPublishesSuccessEvent() {
        User user = user(42, "alice@example.com", "1112223333");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.changePhoneNumber(42, "9998887777");

        assertSame(user, result);
        assertEquals("9998887777", user.getPhoneNumber());
        verify(userRepository).save(user);
        verify(userAuditEventPublisher).publish("CHANGE_PHONE_NUMBER", 42, "SUCCESS", "Phone number changed");
    }

    @Test
    void changePhoneNumber_rejectsBlankPhoneAndPublishesFailureEvent() {
        User user = user(42, "alice@example.com", "1112223333");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> userService.changePhoneNumber(42, ""));

        assertEquals("New phone number is required.", ex.getMessage());
        verify(userRepository, never()).save(user);
        verify(userAuditEventPublisher).publish("CHANGE_PHONE_NUMBER", 42, "FAILURE", "New phone number is required.");
    }

    @Test
    void changePhoneNumber_throwsNotFoundWhenUserIsMissing() {
        when(userRepository.findById(42)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.changePhoneNumber(42, "9998887777")
        );

        assertEquals("User 42 not found.", ex.getMessage());
        verify(userAuditEventPublisher, never()).publish(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    private User user(Integer userId, String email, String phoneNumber) {
        User user = new User();
        user.setUserId(userId);
        user.setRoleId(1);
        user.setUsername("alice");
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setCreatedAt(LocalDateTime.now());
        user.setPhoneNumber(phoneNumber);
        user.setLastLogin(LocalDateTime.now());
        user.setRewardPoints(0);
        user.setTokenVersion(0);
        user.setDateOfBirth(LocalDate.of(1990, 1, 1));
        return user;
    }
}