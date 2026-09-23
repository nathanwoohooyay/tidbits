package com.tidbits.model.dto;

import java.time.LocalDateTime;

public class UserDTO {
    private Integer userId;
    private String username;
    private String email;
    private LocalDateTime createdAt;
    private String phoneNumber;
    private LocalDateTime lastLogin;
    private Integer rewardPoints;

    public UserDTO() {
    }

    public UserDTO(Integer userId, String username, String email, LocalDateTime createdAt,
                   String phoneNumber, LocalDateTime lastLogin, Integer rewardPoints) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.createdAt = createdAt;
        this.phoneNumber = phoneNumber;
        this.lastLogin = lastLogin;
        this.rewardPoints = rewardPoints;
    }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    public Integer getRewardPoints() { return rewardPoints; }
    public void setRewardPoints(Integer rewardPoints) { this.rewardPoints = rewardPoints; }
}
