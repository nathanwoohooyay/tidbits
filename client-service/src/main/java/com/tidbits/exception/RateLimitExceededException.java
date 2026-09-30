package com.tidbits.exception;

public class RateLimitExceededException extends RuntimeException {
    private final String retryAfter;

    public RateLimitExceededException(String message) {
        super(message);
        this.retryAfter = null;
    }

    public RateLimitExceededException(String message, String retryAfter) {
        super(message);
        this.retryAfter = retryAfter;
    }

    public RateLimitExceededException(String message, Throwable cause) {
        super(message, cause);
        this.retryAfter = null;
    }

    public RateLimitExceededException(String message, Throwable cause, String retryAfter) {
        super(message, cause);
        this.retryAfter = retryAfter;
    }

    public String getRetryAfter() {
        return retryAfter;
    }
}
