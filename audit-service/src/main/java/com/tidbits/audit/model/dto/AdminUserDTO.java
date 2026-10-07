package com.tidbits.audit.model.dto;

import com.tidbits.audit.model.enums.RoleType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AdminUserDTO {
    private Integer userId;
    private String username;
    private String email;
    private String phoneNumber;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private Integer rewardPoints;
    private LocalDate dateOfBirth;
    private Integer roleId;
    private RoleType roleName;

    public AdminUserDTO() {}

    public AdminUserDTO(Integer userId, String username, String email, String phoneNumber,
                        LocalDateTime createdAt, LocalDateTime lastLogin, Integer rewardPoints,
                        LocalDate dateOfBirth, Integer roleId, RoleType roleName) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
        this.rewardPoints = rewardPoints;
        this.dateOfBirth = dateOfBirth;
        this.roleId = roleId;
        this.roleName = roleName;
    }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    public Integer getRewardPoints() { return rewardPoints; }
    public void setRewardPoints(Integer rewardPoints) { this.rewardPoints = rewardPoints; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }
    public RoleType getRoleName() { return roleName; }
    public void setRoleName(RoleType roleName) { this.roleName = roleName; }
}
