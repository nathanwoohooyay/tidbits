package com.tidbits.repository;

import com.tidbits.model.entity.LotteryTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotteryTicketRepository extends JpaRepository<LotteryTicket, Integer> {
    long countByDrawIdAndUserId(Integer drawId, Integer userId);

    @Query("SELECT t.ticketId FROM LotteryTicket t WHERE t.drawId = :drawId ORDER BY t.ticketId")
    List<Integer> findTicketIdsByDrawId(@Param("drawId") Integer drawId);
}
