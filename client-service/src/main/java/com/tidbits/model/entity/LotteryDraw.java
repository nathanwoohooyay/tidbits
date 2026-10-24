package com.tidbits.model.entity;

import com.tidbits.model.enums.LotteryDrawStatus;
import com.tidbits.model.enums.LotteryPrize;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lottery_draws")
public class LotteryDraw {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "draw_id")
    private Integer drawId;

    @Column(name = "ticket_price", nullable = false)
    private Integer ticketPrice;

    @Column(name = "seed_pot", nullable = false)
    private Integer seedPot;

    @Column(name = "tickets_sold", nullable = false)
    private Integer ticketsSold;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LotteryDrawStatus status;

    @Column(name = "opens_at", nullable = false)
    private LocalDateTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private LocalDateTime closesAt;

    @Column(name = "winning_ticket_id")
    private Integer winningTicketId;

    @Column(name = "winner_user_id")
    private Integer winnerUserId;

    @Column(name = "prize_points")
    private Integer prizePoints;

    @Column(name = "drawn_at")
    private LocalDateTime drawnAt;

    /** Null for legacy points-pot draws. */
    @Enumerated(EnumType.STRING)
    @Column(name = "prize_code")
    private LotteryPrize prize;

    @Column(name = "prize_name")
    private String prizeName;

    @Column(name = "prize_description", length = 1000)
    private String prizeDescription;

    @Column(name = "fulfillment_status")
    private String fulfillmentStatus;

    public LotteryPrize getPrize() { return prize; }
    public void setPrize(LotteryPrize prize) { this.prize = prize; }
    public String getPrizeName() { return prizeName; }
    public void setPrizeName(String prizeName) { this.prizeName = prizeName; }
    public String getPrizeDescription() { return prizeDescription; }
    public void setPrizeDescription(String prizeDescription) { this.prizeDescription = prizeDescription; }
    public String getFulfillmentStatus() { return fulfillmentStatus; }
    public void setFulfillmentStatus(String fulfillmentStatus) { this.fulfillmentStatus = fulfillmentStatus; }

    public LotteryDraw() {
    }

    public Integer getDrawId() { return drawId; }
    public void setDrawId(Integer drawId) { this.drawId = drawId; }

    public Integer getTicketPrice() { return ticketPrice; }
    public void setTicketPrice(Integer ticketPrice) { this.ticketPrice = ticketPrice; }

    public Integer getSeedPot() { return seedPot; }
    public void setSeedPot(Integer seedPot) { this.seedPot = seedPot; }

    public Integer getTicketsSold() { return ticketsSold; }
    public void setTicketsSold(Integer ticketsSold) { this.ticketsSold = ticketsSold; }

    public LotteryDrawStatus getStatus() { return status; }
    public void setStatus(LotteryDrawStatus status) { this.status = status; }

    public LocalDateTime getOpensAt() { return opensAt; }
    public void setOpensAt(LocalDateTime opensAt) { this.opensAt = opensAt; }

    public LocalDateTime getClosesAt() { return closesAt; }
    public void setClosesAt(LocalDateTime closesAt) { this.closesAt = closesAt; }

    public Integer getWinningTicketId() { return winningTicketId; }
    public void setWinningTicketId(Integer winningTicketId) { this.winningTicketId = winningTicketId; }

    public Integer getWinnerUserId() { return winnerUserId; }
    public void setWinnerUserId(Integer winnerUserId) { this.winnerUserId = winnerUserId; }

    public Integer getPrizePoints() { return prizePoints; }
    public void setPrizePoints(Integer prizePoints) { this.prizePoints = prizePoints; }

    public LocalDateTime getDrawnAt() { return drawnAt; }
    public void setDrawnAt(LocalDateTime drawnAt) { this.drawnAt = drawnAt; }
}
