package com.tidbits.service;

import com.tidbits.model.entity.AccountHolding;
import com.tidbits.repository.AccountHoldingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountHoldingService {

    @Autowired
    private AccountHoldingRepository accountHoldingRepository;

    public AccountHolding createAccountHolding(AccountHolding accountHolding) {
        return null;
    }

    public Optional<AccountHolding> getAccountHoldingById(Integer holdingId) {
        return Optional.empty();
    }

    public List<AccountHolding> getHoldingsByAccountId(Integer accountId) {
        return List.of();
    }

    public Optional<AccountHolding> getHoldingByAccountAndInstrument(Integer accountId, Integer instrumentId) {
        return Optional.empty();
    }

    public List<AccountHolding> getAllAccountHoldings() {
        return List.of();
    }

    public AccountHolding updateAccountHolding(Integer holdingId, AccountHolding accountHolding) {
        return null;
    }

    public void deleteAccountHolding(Integer holdingId) {
    }
}
