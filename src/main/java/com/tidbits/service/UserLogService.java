package com.tidbits.service;

import com.tidbits.model.entity.UserLog;
import com.tidbits.repository.UserLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserLogService {

    @Autowired
    private UserLogRepository userLogRepository;

    public UserLog createUserLog(UserLog userLog) {
        return null;
    }

    public Optional<UserLog> getUserLogById(Integer logId) {
        return Optional.empty();
    }

    public List<UserLog> getLogsByUserId(Integer userId) {
        return List.of();
    }

    public List<UserLog> getAllUserLogs() {
        return List.of();
    }

    public UserLog updateUserLog(Integer logId, UserLog userLog) {
        return null;
    }

    public void deleteUserLog(Integer logId) {
    }
}
