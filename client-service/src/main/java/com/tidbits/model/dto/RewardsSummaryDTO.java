package com.tidbits.model.dto;

import java.util.List;

public record RewardsSummaryDTO(
        Integer balance,
        Long lifetimeEarned,
        Long lifetimeSpent,
        Integer maxTicketsPerPurchase,
        List<LotteryDrawDTO> draws,
        List<LotteryDrawDTO> lastDraws
) {
}
