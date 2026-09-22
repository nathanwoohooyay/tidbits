package com.tidbits.model.entity;

import jakarta.persistence.*;
import com.tidbits.model.enums.LogStatus;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_logs")
public class UserLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "event")
    private String event;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private LogStatus status;

    @Column(name = "happened_at")
    private LocalDateTime happenedAt;

    public UserLog() {
    }

    public UserLog(Integer logId, Integer userId, String ipAddress, String event,
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
