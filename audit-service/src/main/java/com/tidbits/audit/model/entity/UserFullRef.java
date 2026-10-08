package com.tidbits.audit.model.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read-only entity mapping the full users table for admin queries.
 */
@Entity
@Table(name = "users")
public class UserFullRef {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "role_id", nullable = false)
    private Integer roleId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login", nullable = false)
    private LocalDateTime lastLogin;

    @Column(name = "reward_points", nullable = false)
    private Integer rewardPoints;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion;

    // Getters
    public Integer getUserId() { return userId; }
    public Integer getRoleId() { return roleId; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public Integer getRewardPoints() { return rewardPoints; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public Integer getTokenVersion() { return tokenVersion; }
}
