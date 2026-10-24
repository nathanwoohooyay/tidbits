package com.tidbits.service;

import com.tidbits.model.entity.PointsTransaction;
import com.tidbits.model.enums.PointsEventType;
import com.tidbits.repository.InstrumentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewardsServiceTest {

    @Mock
    private PointsLedgerService pointsLedgerService;

    @Mock
    private LotteryService lotteryService;

    @Mock
    private InstrumentRepository instrumentRepository;

    @InjectMocks
    private RewardsService rewardsService;

    @Test
    void buyLotteryTickets_entersTheChosenDraw() {
        when(lotteryService.buyTickets(1, 5, 2)).thenReturn(ledgerEntry(PointsEventType.LOTTERY_TICKET, -2_000));

        assertEquals(-2_000, rewardsService.buyLotteryTickets(1, 5, 2).pointsDelta());
        verify(lotteryService).buyTickets(1, 5, 2);
    }

    @Test
    void pointsToCash_floorsToCents() {
        assertEquals(1.0, RewardsService.pointsToCash(1_000));
        assertEquals(0.12, RewardsService.pointsToCash(129));
        assertEquals(0.0, RewardsService.pointsToCash(0));
    }

    private PointsTransaction ledgerEntry(PointsEventType type, int delta) {
        PointsTransaction entry = new PointsTransaction();
        entry.setPointsTransactionId(1);
        entry.setEventType(type);
        entry.setPointsDelta(delta);
        entry.setBalanceAfter(0);
        return entry;
    }
}
