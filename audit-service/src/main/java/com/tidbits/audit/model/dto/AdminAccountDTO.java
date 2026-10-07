package com.tidbits.audit.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminAccountDTO {
    private Integer accountId;
    private Integer userId;
    private String nickname;
    private BigDecimal cashBalance;
    private LocalDateTime createdAt;

    public AdminAccountDTO() {}

    public AdminAccountDTO(Integer accountId, Integer userId, String nickname,
                           BigDecimal cashBalance, LocalDateTime createdAt) {
        this.accountId = accountId;
        this.userId = userId;
        this.nickname = nickname;
        this.cashBalance = cashBalance;
        this.createdAt = createdAt;
    }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public BigDecimal getCashBalance() { return cashBalance; }
    public void setCashBalance(BigDecimal cashBalance) { this.cashBalance = cashBalance; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
