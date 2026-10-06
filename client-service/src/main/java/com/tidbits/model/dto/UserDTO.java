package com.tidbits.model.dto;

import java.time.LocalDate;

public class UserDTO {
    private Integer userId;
    private String username;
    private String email;
    private String phoneNumber;
    private Integer rewardPoints;
    private LocalDate dateOfBirth;

    public UserDTO() {
    }

    public UserDTO(Integer userId, String username, String email,
                   String phoneNumber, Integer rewardPoints, LocalDate dateOfBirth) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.rewardPoints = rewardPoints;
        this.dateOfBirth = dateOfBirth;
    }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Integer getRewardPoints() { return rewardPoints; }
    public void setRewardPoints(Integer rewardPoints) { this.rewardPoints = rewardPoints; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
}
