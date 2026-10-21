package com.tidbits.audit.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Read-only entity mapping the full accounts table for admin queries.
 */
@Entity
@Table(name = "accounts")
public class AccountFullRef {

    @Id
    @Column(name = "account_id")
    private Integer accountId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "cash_balance")
    private BigDecimal cashBalance;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Getters
    public Integer getAccountId() { return accountId; }
    public Integer getUserId() { return userId; }
    public String getNickname() { return nickname; }
    public BigDecimal getCashBalance() { return cashBalance; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
