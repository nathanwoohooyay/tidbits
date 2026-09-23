package com.tidbits.model.dto;

import java.time.LocalDateTime;

public class AccountDTO {
    private Integer accountId;
    private Integer userId;
    private String nickname;
    private Double cashBalance;

    public AccountDTO() {
    }

    public AccountDTO(Integer accountId, Integer userId, String nickname, Double cashBalance) {
        this.accountId = accountId;
        this.userId = userId;
        this.nickname = nickname;
    }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public Double getCashBalance() { return cashBalance; }
    public void setCashBalance(Double cashBalance) { this.cashBalance = cashBalance; }
}
