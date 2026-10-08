package com.tidbits.mapper;

import com.tidbits.model.dto.AccountHoldingDTO;
import com.tidbits.model.entity.AccountHolding;

public class AccountHoldingMapper {

    public static AccountHoldingDTO toDto(AccountHolding holding) {
        if (holding == null) {
            return null;
        }
        AccountHoldingDTO dto = new AccountHoldingDTO();
        dto.setHoldingId(holding.getHoldingId());
        dto.setInstrumentId(holding.getInstrumentId());
        dto.setQuantity(holding.getQuantity());
        dto.setAmountInvested(holding.getAmountInvested());
        return dto;
    }
}
