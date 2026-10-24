package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.PointsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointsLogRepository extends JpaRepository<PointsLog, Integer> {
    List<PointsLog> findByUserId(Integer userId);
}
