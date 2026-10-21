package com.tidbits.service;

import com.tidbits.model.entity.AccountHolding;
import com.tidbits.repository.AccountHoldingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountHoldingServiceTest {

    @Mock
    private AccountHoldingRepository accountHoldingRepository;

    @InjectMocks
    private AccountHoldingService accountHoldingService;

    @Test
    void getStockHolding_returnsQuantityWhenHoldingExists() {
        AccountHolding holding = holding(7, 42, 3, 10.5, 1200.0);
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(42, 3)).thenReturn(Optional.of(holding));

        double result = accountHoldingService.getStockHolding(42, 3);

        assertEquals(10.5, result);
    }

    @Test
    void getStockHolding_returnsZeroWhenHoldingMissing() {
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(42, 3)).thenReturn(Optional.empty());

        double result = accountHoldingService.getStockHolding(42, 3);

        assertEquals(0.0, result);
    }

    @Test
    void getAccountHoldingById_returnsRepositoryResult() {
        AccountHolding holding = holding(7, 42, 3, 10.5, 1200.0);
        when(accountHoldingRepository.findById(7)).thenReturn(Optional.of(holding));

        Optional<AccountHolding> result = accountHoldingService.getAccountHoldingById(7);

        assertEquals(Optional.of(holding), result);
        verify(accountHoldingRepository).findById(7);
    }

    @Test
    void getAllAccountHoldingsByAccountId_returnsRepositoryResult() {
        List<AccountHolding> holdings = List.of(
                holding(7, 42, 3, 10.5, 1200.0),
                holding(8, 42, 8, 1.0, 400.0)
        );
        when(accountHoldingRepository.findByAccountId(42)).thenReturn(holdings);

        List<AccountHolding> result = accountHoldingService.getAllAccountHoldingsByAccountId(42);

        assertSame(holdings, result);
    }

    @Test
    void getHoldingByAccountAndInstrument_returnsRepositoryResult() {
        AccountHolding holding = holding(7, 42, 3, 10.5, 1200.0);
        when(accountHoldingRepository.findByAccountIdAndInstrumentId(42, 3)).thenReturn(Optional.of(holding));

        Optional<AccountHolding> result = accountHoldingService.getHoldingByAccountAndInstrument(42, 3);

        assertEquals(Optional.of(holding), result);
    }

    private AccountHolding holding(Integer holdingId, Integer accountId, Integer instrumentId,
                                   Double quantity, Double amountInvested) {
        return new AccountHolding(holdingId, accountId, instrumentId, quantity, amountInvested, LocalDateTime.now());
    }
}
