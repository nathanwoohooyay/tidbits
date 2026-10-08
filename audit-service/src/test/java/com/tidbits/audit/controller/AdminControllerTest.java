package com.tidbits.audit.controller;

import com.tidbits.audit.service.AccessRevocationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AccessRevocationService accessRevocationService;

    @InjectMocks
    private AdminController adminController;

    @Test
    void revokeAccess_callsServiceAndReturnsOkMessage() {
        ResponseEntity<String> response = adminController.revokeAccess(77);

        verify(accessRevocationService).revokeUserAccess(77);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("User access revoked", response.getBody());
    }
}
