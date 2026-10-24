package com.tidbits.model.dto;

import java.time.LocalDateTime;

public record LotteryDrawDTO(
        Integer drawId,
        String status,
        Integer ticketPrice,
        Integer potPoints,
        Double potCashValue,
        Integer ticketsSold,
        Long myTickets,
        LocalDateTime closesAt,
        LocalDateTime drawnAt,
        String winnerLabel,
        Boolean wonByMe,
        String prizeCode,
        String prizeName,
        String prizeDescription,
        String fulfillmentStatus
) {
}
