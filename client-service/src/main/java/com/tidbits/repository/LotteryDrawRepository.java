package com.tidbits.repository;

import com.tidbits.model.entity.LotteryDraw;
import com.tidbits.model.enums.LotteryDrawStatus;
import com.tidbits.model.enums.LotteryPrize;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LotteryDrawRepository extends JpaRepository<LotteryDraw, Integer> {
    List<LotteryDraw> findByStatusOrderByClosesAtAsc(LotteryDrawStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<LotteryDraw> findLockedByDrawId(Integer drawId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<LotteryDraw> findByStatusAndClosesAtLessThanEqual(LotteryDrawStatus status, LocalDateTime closesAt);

    Optional<LotteryDraw> findFirstByPrizeAndStatusOrderByDrawnAtDesc(LotteryPrize prize, LotteryDrawStatus status);
}
