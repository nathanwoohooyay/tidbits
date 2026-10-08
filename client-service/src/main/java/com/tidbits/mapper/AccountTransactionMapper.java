package com.tidbits.mapper;

import com.tidbits.model.dto.AccountTransactionDTO;
import com.tidbits.model.entity.AccountTransaction;

public final class AccountTransactionMapper {

    private AccountTransactionMapper() {
    }

    public static AccountTransactionDTO toDto(AccountTransaction accountTransaction) {
        if (accountTransaction == null) {
            return null;
        }

        return new AccountTransactionDTO(
                accountTransaction.getTransactionId(),
                accountTransaction.getOrderId(),
                accountTransaction.getAmount(),
                accountTransaction.getTransactionType()
        );
    }
}
