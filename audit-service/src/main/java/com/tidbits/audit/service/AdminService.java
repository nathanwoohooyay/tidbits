package com.tidbits.audit.service;

import com.tidbits.audit.model.dto.AdminAccountDTO;
import com.tidbits.audit.model.dto.AdminDashboardDTO;
import com.tidbits.audit.model.dto.AdminUserDTO;
import com.tidbits.audit.model.entity.AccountFullRef;
import com.tidbits.audit.model.entity.Role;
import com.tidbits.audit.model.entity.UserFullRef;
import com.tidbits.audit.model.enums.RoleType;
import com.tidbits.audit.repository.AccountFullRefRepository;
import com.tidbits.audit.repository.RoleRepository;
import com.tidbits.audit.repository.TransactionLogRepository;
import com.tidbits.audit.repository.UserFullRefRepository;
import com.tidbits.audit.repository.UserLogRepository;
import com.tidbits.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserFullRefRepository userFullRefRepository;

    @Autowired
    private AccountFullRefRepository accountFullRefRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserLogRepository userLogRepository;

    @Autowired
    private TransactionLogRepository transactionLogRepository;

    /**
     * Get all users with their resolved role names.
     */
    public List<AdminUserDTO> getAllUsers() {
        List<UserFullRef> users = userFullRefRepository.findAll();
        Map<Integer, RoleType> roleMap = buildRoleMap();

        return users.stream()
                .map(u -> toAdminUserDTO(u, roleMap))
                .collect(Collectors.toList());
    }

    /**
     * Get a single user by ID with resolved role name.
     */
    public AdminUserDTO getUserById(Integer userId) {
        UserFullRef user = userFullRefRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + userId));
        Map<Integer, RoleType> roleMap = buildRoleMap();
        return toAdminUserDTO(user, roleMap);
    }

    /**
     * Get all accounts for a specific user.
     */
    public List<AdminAccountDTO> getAccountsByUserId(Integer userId) {
        // Verify user exists
        if (!userFullRefRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found for id: " + userId);
        }

        return accountFullRefRepository.findByUserId(userId).stream()
                .map(this::toAdminAccountDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get dashboard summary statistics.
     */
    public AdminDashboardDTO getDashboardStats() {
        return new AdminDashboardDTO(
                userFullRefRepository.count(),
                accountFullRefRepository.count(),
                userLogRepository.count(),
                transactionLogRepository.count()
        );
    }

    // ────── Helpers ──────

    private Map<Integer, RoleType> buildRoleMap() {
        return roleRepository.findAll().stream()
                .collect(Collectors.toMap(Role::getRoleId, Role::getName));
    }

    private AdminUserDTO toAdminUserDTO(UserFullRef u, Map<Integer, RoleType> roleMap) {
        return new AdminUserDTO(
                u.getUserId(),
                u.getUsername(),
                u.getEmail(),
                u.getPhoneNumber(),
                u.getCreatedAt(),
                u.getLastLogin(),
                u.getRewardPoints(),
                u.getDateOfBirth(),
                u.getRoleId(),
                roleMap.getOrDefault(u.getRoleId(), null)
        );
    }

    private AdminAccountDTO toAdminAccountDTO(AccountFullRef a) {
        return new AdminAccountDTO(
                a.getAccountId(),
                a.getUserId(),
                a.getNickname(),
                a.getCashBalance(),
                a.getCreatedAt()
        );
    }
}
