package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.model.entity.UserRoleRef;
import com.tidbits.audit.model.enums.LogStatus;
import com.tidbits.audit.repository.RefreshTokenRefRepository;
import com.tidbits.audit.repository.UserRoleRefRepository;
import com.tidbits.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccessRevocationService {

    private static final String ACCESS_REVOKED_EVENT = "ACCESS_REVOKED";

    @Autowired
    private UserRoleRefRepository userRoleRefRepository;

    @Autowired
    private RefreshTokenRefRepository refreshTokenRefRepository;

    @Autowired
    private UserLogService userLogService;

    @Transactional
    public void revokeUserAccess(Integer userId) {
        UserRoleRef userRef = userRoleRefRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + userId));

        Integer currentTokenVersion = userRef.getTokenVersion() == null ? 0 : userRef.getTokenVersion();
        userRef.setTokenVersion(currentTokenVersion + 1);
        userRoleRefRepository.save(userRef);

        refreshTokenRefRepository.deleteByUserId(userId);

        UserLog userLog = new UserLog();
        userLog.setUserId(userId);
        userLog.setEvent(ACCESS_REVOKED_EVENT);
        userLog.setStatus(LogStatus.SUCCESS);
        userLogService.createUserLog(userLog);
    }
}