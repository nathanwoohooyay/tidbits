package com.tidbits.service;

import com.tidbits.exception.BusinessException;
import com.tidbits.model.dto.PointsEventDTO;
import com.tidbits.model.entity.PointsTransaction;
import com.tidbits.model.entity.User;
import com.tidbits.model.enums.PointsEventType;
import com.tidbits.repository.PointsTransactionRepository;
import com.tidbits.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointsLedgerServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointsTransactionRepository pointsTransactionRepository;

    @Mock
    private PointsEventPublisher pointsEventPublisher;

    @InjectMocks
    private PointsLedgerService pointsLedgerService;

    @Test
    void record_creditsBalanceWritesLedgerAndPublishesAfterCommit() {
        User user = user(7, 1_000);
        when(userRepository.findByIdForUpdate(7)).thenReturn(Optional.of(user));
        when(pointsTransactionRepository.save(any(PointsTransaction.class))).thenAnswer(invocation -> {
            PointsTransaction entry = invocation.getArgument(0);
            entry.setPointsTransactionId(42);
            return entry;
        });

        PointsTransaction entry = pointsLedgerService.record(7, PointsEventType.EARN_TRADE, 250,
                new PointsLedgerService.Details(3, 250.0, 2, 1.0, 99, "Earned on order #99"));

        assertEquals(1_250, user.getRewardPoints());
        assertEquals(1_250, entry.getBalanceAfter());
        assertEquals(3, entry.getAccountId());
        assertEquals(99, entry.getReferenceId());
        verify(userRepository).save(user);

        ArgumentCaptor<PointsEventDTO> event = ArgumentCaptor.forClass(PointsEventDTO.class);
        verify(pointsEventPublisher).publishAfterCommit(event.capture());
        assertEquals("EARN_TRADE", event.getValue().eventType());
        assertEquals(42, event.getValue().pointsTransactionId());
        assertEquals("SUCCESS", event.getValue().status());
    }

    @Test
    void record_rejectsOverdraftAndPublishesFailureImmediately() {
        User user = user(7, 100);
        when(userRepository.findByIdForUpdate(7)).thenReturn(Optional.of(user));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                pointsLedgerService.record(7, PointsEventType.LOTTERY_TICKET, -250, PointsLedgerService.Details.of("Lottery ticket")));

        assertEquals("Insufficient points: 100 available, 250 required.", ex.getMessage());
        assertEquals(100, user.getRewardPoints());
        verify(pointsTransactionRepository, never()).save(any());
        verify(pointsEventPublisher, never()).publishAfterCommit(any());

        ArgumentCaptor<PointsEventDTO> event = ArgumentCaptor.forClass(PointsEventDTO.class);
        verify(pointsEventPublisher).publish(event.capture());
        assertEquals("FAILURE", event.getValue().status());
        assertEquals(-250, event.getValue().pointsDelta());
        assertEquals("Insufficient points: Lottery ticket", event.getValue().details());
    }

    @Test
    void record_rejectsZeroDelta() {
        assertThrows(BusinessException.class, () ->
                pointsLedgerService.record(7, PointsEventType.STOCK_DROP, 0, null));
    }

    @Test
    void record_auditsNonCashLotteryWinWithoutChangingBalance() {
        User user = user(7, 1_000);
        when(userRepository.findByIdForUpdate(7)).thenReturn(Optional.of(user));
        when(pointsTransactionRepository.save(any(PointsTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PointsTransaction entry = pointsLedgerService.record(7, PointsEventType.LOTTERY_WIN, 0,
                new PointsLedgerService.Details(null, null, null, null, 5, "Won VIP sports tickets; fulfillment pending"));

        assertEquals(1_000, user.getRewardPoints());
        assertEquals(0, entry.getPointsDelta());
        ArgumentCaptor<PointsEventDTO> event = ArgumentCaptor.forClass(PointsEventDTO.class);
        verify(pointsEventPublisher).publishAfterCommit(event.capture());
        assertEquals("LOTTERY_WIN", event.getValue().eventType());
        assertEquals(5, event.getValue().referenceId());
        assertEquals(0, event.getValue().pointsDelta());
    }

    private User user(Integer userId, Integer points) {
        User user = new User();
        user.setUserId(userId);
        user.setRewardPoints(points);
        return user;
    }
}
