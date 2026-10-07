package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.User;
import com.tidbits.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

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

    private UserService userService;

    private RecordingUserAuditEventPublisher userAuditEventPublisher;

    @BeforeEach
    void setUp() {
        userService = new UserService();
        userAuditEventPublisher = new RecordingUserAuditEventPublisher();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);
        ReflectionTestUtils.setField(userService, "userAuditEventPublisher", userAuditEventPublisher);
    }

    @Test
    void changeEmail_updatesEmailAndPublishesSuccessEvent() {
        User user = user(42, "alice@example.com", "1112223333");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.changeEmail(42, "new@example.com");

        assertSame(user, result);
        assertEquals("new@example.com", user.getEmail());
        verify(userRepository).save(user);
        assertEquals("CHANGE_EMAIL", userAuditEventPublisher.eventType);
        assertEquals(42, userAuditEventPublisher.userId);
        assertEquals("SUCCESS", userAuditEventPublisher.status);
        assertEquals("Email changed", userAuditEventPublisher.details);
        assertEquals(1, userAuditEventPublisher.publishCount);
    }

    @Test
    void changeEmail_rejectsBlankEmailAndPublishesFailureEvent() {
        User user = user(42, "alice@example.com", "1112223333");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> userService.changeEmail(42, "   "));

        assertEquals("New email is required.", ex.getMessage());
        verify(userRepository, never()).save(user);
        assertEquals("CHANGE_EMAIL", userAuditEventPublisher.eventType);
        assertEquals(42, userAuditEventPublisher.userId);
        assertEquals("FAILURE", userAuditEventPublisher.status);
        assertEquals("New email is required.", userAuditEventPublisher.details);
        assertEquals(1, userAuditEventPublisher.publishCount);
    }

    @Test
    void changeEmail_throwsNotFoundWhenUserIsMissing() {
        when(userRepository.findById(42)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.changeEmail(42, "new@example.com")
        );

        assertEquals("User 42 not found.", ex.getMessage());
        assertEquals(0, userAuditEventPublisher.publishCount);
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
        assertEquals("CHANGE_PHONE_NUMBER", userAuditEventPublisher.eventType);
        assertEquals(42, userAuditEventPublisher.userId);
        assertEquals("SUCCESS", userAuditEventPublisher.status);
        assertEquals("Phone number changed", userAuditEventPublisher.details);
        assertEquals(1, userAuditEventPublisher.publishCount);
    }

    @Test
    void changePhoneNumber_rejectsBlankPhoneAndPublishesFailureEvent() {
        User user = user(42, "alice@example.com", "1112223333");
        when(userRepository.findById(42)).thenReturn(Optional.of(user));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> userService.changePhoneNumber(42, ""));

        assertEquals("New phone number is required.", ex.getMessage());
        verify(userRepository, never()).save(user);
        assertEquals("CHANGE_PHONE_NUMBER", userAuditEventPublisher.eventType);
        assertEquals(42, userAuditEventPublisher.userId);
        assertEquals("FAILURE", userAuditEventPublisher.status);
        assertEquals("New phone number is required.", userAuditEventPublisher.details);
        assertEquals(1, userAuditEventPublisher.publishCount);
    }

    @Test
    void changePhoneNumber_throwsNotFoundWhenUserIsMissing() {
        when(userRepository.findById(42)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.changePhoneNumber(42, "9998887777")
        );

        assertEquals("User 42 not found.", ex.getMessage());
        assertEquals(0, userAuditEventPublisher.publishCount);
    }

    private static class RecordingUserAuditEventPublisher extends UserAuditEventPublisher {
        private String eventType;
        private Integer userId;
        private String status;
        private String details;
        private int publishCount;

        RecordingUserAuditEventPublisher() {
            super(null, null, "test-topic");
        }

        @Override
        public void publish(String eventType, Integer userId, String status, String details) {
            this.eventType = eventType;
            this.userId = userId;
            this.status = status;
            this.details = details;
            this.publishCount++;
        }
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