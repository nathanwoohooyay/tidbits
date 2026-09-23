package com.tidbits.model.dto;

public class AccountCreateRequestDTO {
    private Integer userId;
    private String nickname;
    private Double initialBalance;

    public AccountCreateRequestDTO() {
    }

    public AccountCreateRequestDTO(Integer userId, String nickname, Double initialBalance) {
        this.userId = userId;
        this.nickname = nickname;
        this.initialBalance = initialBalance;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public Double getInitialBalance() {
        return initialBalance;
    }

    public void setInitialBalance(Double initialBalance) {
        this.initialBalance = initialBalance;
    }
}
