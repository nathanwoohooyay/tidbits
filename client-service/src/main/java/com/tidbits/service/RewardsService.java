package com.tidbits.service;

import com.tidbits.model.dto.PointsTransactionDTO;
import com.tidbits.model.dto.RewardsSummaryDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.PointsTransaction;
import com.tidbits.repository.InstrumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class RewardsService {

    /** Only used to value legacy points-pot draws. */
    public static final int POINTS_PER_DOLLAR = 1000;

    @Autowired
    private PointsLedgerService pointsLedgerService;

    @Autowired
    private LotteryService lotteryService;

    @Autowired
    private InstrumentRepository instrumentRepository;

    @Transactional
    public RewardsSummaryDTO getSummary(Integer userId) {
        return new RewardsSummaryDTO(
                pointsLedgerService.getBalance(userId),
                pointsLedgerService.getLifetimeEarned(userId),
                pointsLedgerService.getLifetimeSpent(userId),
                LotteryService.MAX_TICKETS_PER_PURCHASE,
                lotteryService.getOrOpenCurrentDraws().stream().map(draw -> lotteryService.toDto(draw, userId)).toList(),
                lotteryService.getLastDraws().stream().map(draw -> lotteryService.toDto(draw, userId)).toList()
        );
    }

    public List<PointsTransactionDTO> getHistory(Integer userId) {
        List<PointsTransaction> history = pointsLedgerService.getHistory(userId);
        Map<Integer, String> tickers = resolveTickers(history);
        return history.stream().map(entry -> toDto(entry, tickers)).collect(Collectors.toList());
    }

    @Transactional
    public PointsTransactionDTO buyLotteryTickets(Integer userId, Integer drawId, Integer quantity) {
        return toDto(lotteryService.buyTickets(userId, drawId, quantity), Map.of());
    }

    public static double pointsToCash(long points) {
        return BigDecimal.valueOf(points).divide(BigDecimal.valueOf(POINTS_PER_DOLLAR), 2, RoundingMode.FLOOR).doubleValue();
    }

    // Legacy stock drop and stock pack entries still carry an instrument.
    private Map<Integer, String> resolveTickers(List<PointsTransaction> entries) {
        List<Integer> instrumentIds = entries.stream()
                .map(PointsTransaction::getInstrumentId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (instrumentIds.isEmpty()) {
            return Map.of();
        }
        return instrumentRepository.findAllById(instrumentIds).stream()
                .collect(Collectors.toMap(Instrument::getInstrumentId, Instrument::getTicker));
    }

    private PointsTransactionDTO toDto(PointsTransaction entry, Map<Integer, String> tickers) {
        return new PointsTransactionDTO(
                entry.getPointsTransactionId(),
                entry.getEventType().name(),
                entry.getPointsDelta(),
                entry.getBalanceAfter(),
                entry.getAccountId(),
                entry.getCashValue(),
                entry.getInstrumentId(),
                entry.getInstrumentId() == null ? null : tickers.get(entry.getInstrumentId()),
                entry.getQuantity(),
                entry.getReferenceId(),
                entry.getDetails(),
                entry.getCreatedAt()
        );
    }

}
