package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.PointsLog;
import com.tidbits.audit.repository.PointsLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PointsLogService {

    @Autowired
    private PointsLogRepository pointsLogRepository;

    public PointsLog createPointsLog(PointsLog pointsLog) {
        return pointsLogRepository.save(pointsLog);
    }

    public List<PointsLog> getLogsByUserId(Integer userId) {
        return pointsLogRepository.findByUserId(userId);
    }

    public List<PointsLog> getAllPointsLogs() {
        return pointsLogRepository.findAll();
    }
}
