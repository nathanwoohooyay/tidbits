package com.tidbits.model.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// A stock a user follows on the dashboard, by ticker.
@Entity
@Table(name = "watchlist_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "ticker"}))
public class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "watchlist_item_id")
    private Integer watchlistItemId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "ticker", nullable = false, length = 8)
    private String ticker;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public WatchlistItem() {
    }

    public WatchlistItem(Integer userId, String ticker, LocalDateTime createdAt) {
        this.userId = userId;
        this.ticker = ticker;
        this.createdAt = createdAt;
    }

    public Integer getWatchlistItemId() { return watchlistItemId; }
    public void setWatchlistItemId(Integer watchlistItemId) { this.watchlistItemId = watchlistItemId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getTicker() { return ticker; }
    public void setTicker(String ticker) { this.ticker = ticker; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
