package com.tidbits.audit.exception;

import com.tidbits.audit.model.dto.ErrorResponseDTO;
import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleResourceNotFound_returnsNotFound() {
        ResponseEntity<ErrorResponseDTO> response = handler.handleResourceNotFound(new ResourceNotFoundException("missing"));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("RESOURCE_NOT_FOUND", response.getBody().errorCode());
    }

    @Test
    void handleResourceNotFound_forNoResourceFound_returnsNotFound() {
        ResponseEntity<ErrorResponseDTO> response = handler.handleResourceNotFound(new NoResourceFoundException(null, "/missing"));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("RESOURCE_NOT_FOUND", response.getBody().errorCode());
    }

    @Test
    void handleBadRequest_returnsBadRequest() {
        ResponseEntity<ErrorResponseDTO> response = handler.handleBadRequest(new BadRequestException("bad"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("BAD_REQUEST", response.getBody().errorCode());
    }

    @Test
    void handleBadRequest_forTypeMismatch_returnsBadRequest() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Integer.class, "id", null, new IllegalArgumentException("bad")
        );

        ResponseEntity<ErrorResponseDTO> response = handler.handleBadRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("BAD_REQUEST", response.getBody().errorCode());
    }

    @Test
    void handleBadRequest_forUnreadableBody_returnsBadRequest() {
        ResponseEntity<ErrorResponseDTO> response = handler.handleBadRequest(new HttpMessageNotReadableException("invalid"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("BAD_REQUEST", response.getBody().errorCode());
    }

    @Test
    void handleAccessDenied_returnsForbidden() {
        ResponseEntity<ErrorResponseDTO> response = handler.handleAccessDenied(new AccessDeniedException("denied"));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("ACCESS_DENIED", response.getBody().errorCode());
    }

    @Test
    void handleGenericException_returnsInternalServerError() {
        ResponseEntity<ErrorResponseDTO> response = handler.handleGenericException(new RuntimeException("boom"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("GENERIC_ERROR", response.getBody().errorCode());
        assertEquals("An unexpected error occurred", response.getBody().message());
    }
}
