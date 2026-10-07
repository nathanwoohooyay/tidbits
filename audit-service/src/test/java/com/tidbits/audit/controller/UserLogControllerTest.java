package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.UserLogDTO;
import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.model.enums.LogStatus;
import com.tidbits.audit.service.UserLogService;
import com.tidbits.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserLogControllerTest {

    @Mock
    private UserLogService userLogService;

    @InjectMocks
    private UserLogController userLogController;

    @Test
    void createUserLog_returnsCreatedStatusAndMappedBody() {
        UserLog saved = log(10, 3, "1.1.1.1", "LOGIN", LogStatus.SUCCESS);
        when(userLogService.createUserLog(saved)).thenReturn(saved);

        ResponseEntity<UserLogDTO> response = userLogController.createUserLog(saved);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(10, response.getBody().getLogId());
        assertEquals("LOGIN", response.getBody().getEvent());
    }

    @Test
    void getUserLogById_throwsWhenMissing() {
        when(userLogService.getUserLogById(404)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userLogController.getUserLogById(404));
    }

    @Test
    void updateAndDelete_delegateToService() {
        UserLog update = log(null, 5, "2.2.2.2", "ACCESS_REVOKED", LogStatus.SUCCESS);
        UserLog updated = log(12, 5, "2.2.2.2", "ACCESS_REVOKED", LogStatus.SUCCESS);
        when(userLogService.updateUserLog(12, update)).thenReturn(updated);

        ResponseEntity<UserLogDTO> updateResponse = userLogController.updateUserLog(12, update);
        ResponseEntity<Void> deleteResponse = userLogController.deleteUserLog(12);

        assertEquals(HttpStatus.OK, updateResponse.getStatusCode());
        assertEquals(12, updateResponse.getBody().getLogId());
        assertEquals(HttpStatus.NO_CONTENT, deleteResponse.getStatusCode());
        verify(userLogService).deleteUserLog(12);
    }

    private UserLog log(Integer id, Integer userId, String ip, String event, LogStatus status) {
        return new UserLog(id, userId, ip, event, status, LocalDateTime.now());
    }
}
