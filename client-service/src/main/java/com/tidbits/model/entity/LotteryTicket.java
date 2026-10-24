package com.tidbits.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lottery_tickets")
public class LotteryTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Integer ticketId;

    @Column(name = "draw_id", nullable = false)
    private Integer drawId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "purchased_at", nullable = false)
    private LocalDateTime purchasedAt;

    public LotteryTicket() {
    }

    public LotteryTicket(Integer drawId, Integer userId, LocalDateTime purchasedAt) {
        this.drawId = drawId;
        this.userId = userId;
        this.purchasedAt = purchasedAt;
    }

    public Integer getTicketId() { return ticketId; }
    public void setTicketId(Integer ticketId) { this.ticketId = ticketId; }

    public Integer getDrawId() { return drawId; }
    public void setDrawId(Integer drawId) { this.drawId = drawId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public LocalDateTime getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(LocalDateTime purchasedAt) { this.purchasedAt = purchasedAt; }
}
