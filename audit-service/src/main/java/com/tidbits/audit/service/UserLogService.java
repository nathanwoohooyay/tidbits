package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.repository.UserLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserLogService {

    @Autowired
    private UserLogRepository userLogRepository;

    public UserLog createUserLog(UserLog userLog) {
        return userLogRepository.save(userLog);
    }

    public Optional<UserLog> getUserLogById(Integer logId) {
        return userLogRepository.findById(logId);
    }

    public List<UserLog> getLogsByUserId(Integer userId) {
        return userLogRepository.findByUserId(userId);
    }

    public List<UserLog> getAllUserLogs() {
        return userLogRepository.findAll();
    }

    public UserLog updateUserLog(Integer logId, UserLog userLog) {
        userLog.setLogId(logId);
        return userLogRepository.save(userLog);
    }

    public void deleteUserLog(Integer logId) {
        userLogRepository.deleteById(logId);
    }
}
