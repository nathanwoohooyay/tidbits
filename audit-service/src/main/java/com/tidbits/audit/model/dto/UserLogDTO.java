package com.tidbits.audit.model.dto;

import com.tidbits.audit.model.enums.LogStatus;
import java.time.LocalDateTime;

public class UserLogDTO {
    private Integer logId;
    private Integer userId;
    private String ipAddress;
    private String event;
    private LogStatus status;
    private LocalDateTime happenedAt;

    public UserLogDTO() {
    }

    public UserLogDTO(Integer logId, Integer userId, String ipAddress, String event,
                      LogStatus status, LocalDateTime happenedAt) {
        this.logId = logId;
        this.userId = userId;
        this.ipAddress = ipAddress;
        this.event = event;
        this.status = status;
        this.happenedAt = happenedAt;
    }

    public Integer getLogId() { return logId; }
    public void setLogId(Integer logId) { this.logId = logId; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public LogStatus getStatus() { return status; }
    public void setStatus(LogStatus status) { this.status = status; }
    public LocalDateTime getHappenedAt() { return happenedAt; }
    public void setHappenedAt(LocalDateTime happenedAt) { this.happenedAt = happenedAt; }
}
