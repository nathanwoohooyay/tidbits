package com.tidbits.model.dto;

import java.time.LocalDateTime;

public class ErrorResponseDTO {
    private String errorCode;
    private String message;
    private LocalDateTime timestamp;
    private String path;
    private Integer status;

    public ErrorResponseDTO() {
    }

    public ErrorResponseDTO(String errorCode, String message, LocalDateTime timestamp, String path, Integer status) {
        this.errorCode = errorCode;
        this.message = message;
        this.timestamp = timestamp;
        this.path = path;
        this.status = status;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }
}
