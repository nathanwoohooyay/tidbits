package com.tidbits.service;

import com.tidbits.exception.BusinessException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.dto.PointsEventDTO;
import com.tidbits.model.entity.PointsTransaction;
import com.tidbits.model.entity.User;
import com.tidbits.model.enums.PointsEventType;
import com.tidbits.repository.PointsTransactionRepository;
import com.tidbits.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Single entry point for changing a user's reward point balance. Every change is
 * written to the points_transactions ledger and published to the audit topic.
 */
@Service
public class PointsLedgerService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointsTransactionRepository pointsTransactionRepository;

    @Autowired
    private PointsEventPublisher pointsEventPublisher;

    /**
     * Optional context recorded alongside a ledger entry.
     */
    public record Details(Integer accountId, Double cashValue, Integer instrumentId, Double quantity,
                          Integer referenceId, String description) {
        public static Details of(String description) {
            return new Details(null, null, null, null, null, description);
        }
    }

    @Transactional
    public PointsTransaction record(Integer userId, PointsEventType eventType, int pointsDelta, Details details) {
        if (pointsDelta == 0 && eventType != PointsEventType.LOTTERY_WIN) {
            throw new BusinessException("Points change must be non-zero.");
        }

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User " + userId + " not found."));

        int currentBalance = user.getRewardPoints() == null ? 0 : user.getRewardPoints();
        int newBalance = Math.addExact(currentBalance, pointsDelta);
        if (newBalance < 0) {
            publishFailure(userId, eventType, pointsDelta, currentBalance, details, "Insufficient points");
            throw new BusinessException("Insufficient points: " + currentBalance + " available, " + (-pointsDelta) + " required.");
        }

        user.setRewardPoints(newBalance);
        userRepository.save(user);

        PointsTransaction entry = new PointsTransaction();
        entry.setUserId(userId);
        entry.setEventType(eventType);
        entry.setPointsDelta(pointsDelta);
        entry.setBalanceAfter(newBalance);
        entry.setCreatedAt(LocalDateTime.now());
        if (details != null) {
            entry.setAccountId(details.accountId());
            entry.setCashValue(details.cashValue());
            entry.setInstrumentId(details.instrumentId());
            entry.setQuantity(details.quantity());
            entry.setReferenceId(details.referenceId());
            entry.setDetails(details.description());
        }
        PointsTransaction saved = pointsTransactionRepository.save(entry);

        pointsEventPublisher.publishAfterCommit(toEvent(saved, "SUCCESS"));
        return saved;
    }

    /**
     * Audits a rejected redemption. Sent immediately because the surrounding
     * transaction is about to roll back.
     */
    public void publishFailure(Integer userId, PointsEventType eventType, int attemptedDelta, Integer balance,
                               Details details, String reason) {
        Details safe = details == null ? Details.of(null) : details;
        String description = safe.description() == null ? reason : reason + ": " + safe.description();
        pointsEventPublisher.publish(new PointsEventDTO(
                eventType.name(),
                LocalDateTime.now(),
                userId,
                safe.accountId(),
                null,
                attemptedDelta,
                balance,
                safe.cashValue(),
                safe.instrumentId(),
                safe.quantity(),
                safe.referenceId(),
                "FAILURE",
                description
        ));
    }

    public int getBalance(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User " + userId + " not found."));
        return user.getRewardPoints() == null ? 0 : user.getRewardPoints();
    }

    public List<PointsTransaction> getHistory(Integer userId) {
        return pointsTransactionRepository.findTop200ByUserIdOrderByCreatedAtDescPointsTransactionIdDesc(userId);
    }

    public long getLifetimeEarned(Integer userId) {
        return pointsTransactionRepository.sumEarnedByUserId(userId);
    }

    public long getLifetimeSpent(Integer userId) {
        return pointsTransactionRepository.sumSpentByUserId(userId);
    }

    private PointsEventDTO toEvent(PointsTransaction entry, String status) {
        return new PointsEventDTO(
                entry.getEventType().name(),
                entry.getCreatedAt(),
                entry.getUserId(),
                entry.getAccountId(),
                entry.getPointsTransactionId(),
                entry.getPointsDelta(),
                entry.getBalanceAfter(),
                entry.getCashValue(),
                entry.getInstrumentId(),
                entry.getQuantity(),
                entry.getReferenceId(),
                status,
                entry.getDetails()
        );
    }
}
