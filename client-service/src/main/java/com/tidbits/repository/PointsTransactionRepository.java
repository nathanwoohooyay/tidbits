package com.tidbits.repository;

import com.tidbits.model.entity.PointsTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointsTransactionRepository extends JpaRepository<PointsTransaction, Integer> {
    List<PointsTransaction> findTop200ByUserIdOrderByCreatedAtDescPointsTransactionIdDesc(Integer userId);

    @Query("SELECT COALESCE(SUM(p.pointsDelta), 0) FROM PointsTransaction p WHERE p.userId = :userId AND p.pointsDelta > 0")
    long sumEarnedByUserId(@Param("userId") Integer userId);

    @Query("SELECT COALESCE(-SUM(p.pointsDelta), 0) FROM PointsTransaction p WHERE p.userId = :userId AND p.pointsDelta < 0")
    long sumSpentByUserId(@Param("userId") Integer userId);
}
