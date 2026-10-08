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

    public double getStockHolding(Integer accountId, Integer instrumentId) {
        return accountHoldingRepository.findByAccountIdAndInstrumentId(accountId, instrumentId)
                .map(accountHolding -> accountHolding.getQuantity())
                .orElse(0.0);
    }

    public Optional<AccountHolding> getAccountHoldingById(Integer holdingId) {
        return accountHoldingRepository.findById(holdingId);
    }

    public List<AccountHolding> getAllAccountHoldingsByAccountId(Integer accountId) {
        return accountHoldingRepository.findByAccountId(accountId);
    }

    public Optional<AccountHolding> getHoldingByAccountAndInstrument(Integer accountId, Integer instrumentId) {
        return accountHoldingRepository.findByAccountIdAndInstrumentId(accountId, instrumentId);
    }
}
