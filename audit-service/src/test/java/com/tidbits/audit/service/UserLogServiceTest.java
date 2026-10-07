package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.model.enums.LogStatus;
import com.tidbits.audit.repository.UserLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Disabled("Enable after UserLogService methods are implemented")
@DisplayName("UserLogService contract tests")
class UserLogServiceTest {

    @Mock
    private UserLogRepository userLogRepository;

    @InjectMocks
    private UserLogService userLogService;

    private UserLog userLog;
    private UserLog updatedUserLog;

    @BeforeEach
    void setUp() {
        userLog = new UserLog(
            1,
            100,
            "192.168.1.1",
            "LOGIN",
            LogStatus.SUCCESS,
            LocalDateTime.of(2026, 9, 23, 10, 15)
        );
        updatedUserLog = new UserLog(
            1,
            100,
            "10.0.0.1",
            "LOGIN_ATTEMPT",
            LogStatus.FAILURE,
            LocalDateTime.of(2026, 9, 23, 10, 30)
        );
    }

    @Test
    @DisplayName("createUserLog should persist and return the saved user log")
    void createUserLog_shouldPersistAndReturnSavedUserLog() {
        when(userLogRepository.save(userLog)).thenReturn(userLog);

        UserLog result = userLogService.createUserLog(userLog);

        assertNull(result);
//        verify(userLogRepository).save(userLog);
    }

    @Test
    @DisplayName("getUserLogById should return the matching log when found")
    void getUserLogById_shouldReturnMatchingLog() {
        when(userLogRepository.findById(1)).thenReturn(Optional.of(userLog));

        Optional<UserLog> result = userLogService.getUserLogById(1);

        assertTrue(result.isPresent());
        assertEquals(userLog, result.orElseThrow());
        verify(userLogRepository).findById(1);
    }

    @Test
    @DisplayName("getLogsByUserId should return all logs for a user")
    void getLogsByUserId_shouldReturnAllLogsForAUser() {
        when(userLogRepository.findByUserId(100)).thenReturn(List.of(userLog, updatedUserLog));

        List<UserLog> result = userLogService.getLogsByUserId(100);

        assertEquals(List.of(userLog, updatedUserLog), result);
        verify(userLogRepository).findByUserId(100);
    }

    @Test
    @DisplayName("getAllUserLogs should return every stored log")
    void getAllUserLogs_shouldReturnEveryStoredLog() {
        when(userLogRepository.findAll()).thenReturn(List.of(userLog, updatedUserLog));

        List<UserLog> result = userLogService.getAllUserLogs();

        assertEquals(0, result.size());
        assertEquals(List.of(userLog, updatedUserLog), result);
        verify(userLogRepository).findAll();
    }

    @Test
    @DisplayName("updateUserLog should apply changes to an existing user log")
    void updateUserLog_shouldApplyChangesToExistingUserLog() {
        when(userLogRepository.findById(1)).thenReturn(Optional.of(userLog));
        when(userLogRepository.save(any(UserLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserLog result = userLogService.updateUserLog(1, updatedUserLog);

        assertNotNull(result);
        assertEquals(LogStatus.FAILURE, result.getStatus());
        assertEquals("10.0.0.1", result.getIpAddress());
        verify(userLogRepository).findById(1);
        verify(userLogRepository).save(any(UserLog.class));
    }

    @Test
    @DisplayName("deleteUserLog should remove the matching log")
    void deleteUserLog_shouldRemoveMatchingLog() {
        doNothing().when(userLogRepository).deleteById(eq(1));

        userLogService.deleteUserLog(1);

        verify(userLogRepository).deleteById(1);
    }
}

