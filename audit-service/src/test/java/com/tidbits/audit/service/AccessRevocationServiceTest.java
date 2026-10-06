package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.model.entity.UserRoleRef;
import com.tidbits.audit.repository.RefreshTokenRefRepository;
import com.tidbits.audit.repository.UserRoleRefRepository;
import com.tidbits.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccessRevocationService contract tests")
class AccessRevocationServiceTest {

    @Mock
    private UserRoleRefRepository userRoleRefRepository;

    @Mock
    private RefreshTokenRefRepository refreshTokenRefRepository;

    @Mock
    private UserLogService userLogService;

    @InjectMocks
    private AccessRevocationService accessRevocationService;

    @Test
    @DisplayName("revokeUserAccess should increment token version, remove refresh token, and log success")
    void revokeUserAccess_shouldIncrementVersionDeleteRefreshTokenAndLog() {
        UserRoleRef userRoleRef = new UserRoleRef();
        userRoleRef.setUserId(21);
        userRoleRef.setRoleId(1);
        userRoleRef.setTokenVersion(3);

        when(userRoleRefRepository.findById(21)).thenReturn(Optional.of(userRoleRef));
        when(userRoleRefRepository.save(any(UserRoleRef.class))).thenAnswer(invocation -> invocation.getArgument(0));

        accessRevocationService.revokeUserAccess(21);

        assertEquals(4, userRoleRef.getTokenVersion());
        verify(refreshTokenRefRepository).deleteByUserId(21);

        ArgumentCaptor<UserLog> userLogCaptor = ArgumentCaptor.forClass(UserLog.class);
        verify(userLogService).createUserLog(userLogCaptor.capture());
        assertEquals(21, userLogCaptor.getValue().getUserId());
        assertEquals("ACCESS_REVOKED", userLogCaptor.getValue().getEvent());
    }

    @Test
    @DisplayName("revokeUserAccess should throw when the user does not exist")
    void revokeUserAccess_shouldThrowWhenUserDoesNotExist() {
        when(userRoleRefRepository.findById(21)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> accessRevocationService.revokeUserAccess(21));

        verify(userRoleRefRepository, never()).save(any(UserRoleRef.class));
        verify(refreshTokenRefRepository, never()).deleteByUserId(any(Integer.class));
        verify(userLogService, never()).createUserLog(any(UserLog.class));
    }
}