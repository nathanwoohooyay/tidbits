package com.tidbits.model.dto;

import java.util.List;

public record ScratchCardResultDTO(
        Integer cardId,
        List<String> symbols,
        String winningSymbol,
        Integer prizePoints,
        Integer balanceAfter
) {
}
