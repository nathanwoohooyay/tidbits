package com.tidbits.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExceptionsTest {

    @Test
    void resourceNotFoundException_preservesMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("missing");
        assertEquals("missing", ex.getMessage());
    }

    @Test
    void badRequestException_preservesMessage() {
        BadRequestException ex = new BadRequestException("bad");
        assertEquals("bad", ex.getMessage());
    }

    @Test
    void businessException_preservesMessage() {
        BusinessException ex = new BusinessException("biz");
        assertEquals("biz", ex.getMessage());
    }

    @Test
    void authenticationException_preservesMessage() {
        AuthenticationException ex = new AuthenticationException("auth");
        assertEquals("auth", ex.getMessage());
    }

    @Test
    void rateLimitExceededException_preservesMessage() {
        RateLimitExceededException ex = new RateLimitExceededException("rate");
        assertEquals("rate", ex.getMessage());
    }
}
