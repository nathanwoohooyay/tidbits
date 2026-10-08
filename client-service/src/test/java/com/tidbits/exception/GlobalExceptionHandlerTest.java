package com.tidbits.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleAuthenticationException_returnsUnauthorized() {
        ResponseEntity<?> response = handler.handleAuthenticationException(new BadCredentialsException("bad creds"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void handleResourceNotFound_returnsNotFound() {
        ResponseEntity<?> response = handler.handleResourceNotFound(new ResourceNotFoundException("missing"));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void handleBadRequest_returnsBadRequest() {
        ResponseEntity<?> response = handler.handleBusinessException(new BadRequestException("bad"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleBusinessException_returnsUnprocessableEntity() {
        ResponseEntity<?> response = handler.handleBusinessException(new BusinessException("biz"));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, response.getStatusCode());
    }

    @Test
    void handleAccessDenied_returnsForbidden() {
        ResponseEntity<?> response = handler.handleAccessDenied(new AccessDeniedException("forbidden"));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void handleTypeMismatch_returnsBadRequest() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Integer.class, "id", null, new IllegalArgumentException("bad type")
        );

        ResponseEntity<?> response = handler.handleTypeMismatch(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleGenericException_returnsInternalServerError() {
        ResponseEntity<?> response = handler.handleGenericException(new RuntimeException("boom"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void handleBadRequest_fromHttpMessageNotReadable_returnsBadRequest() {
        ResponseEntity<?> response = handler.handleBusinessException(new HttpMessageNotReadableException("invalid body"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleResourceNotFound_fromNoResourceFound_returnsNotFound() {
        ResponseEntity<?> response = handler.handleResourceNotFound(new NoResourceFoundException(null, "/missing"));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
