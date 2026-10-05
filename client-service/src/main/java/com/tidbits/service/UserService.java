package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.User;
import com.tidbits.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserAuditEventPublisher userAuditEventPublisher;

    public User createUser(User user) {
        return null;
    }

    public Optional<User> getUserById(Integer userId) {
        return userRepository.findById(userId);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(Integer userId, User user) {
        return null;
    }

    public User partiallyUpdateUser(Integer userId, User user) {
        return null;
    }

    public User changePassword(Integer userId, String newPassword, String currentPassword, String confirmPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User " + userId + " not found."));

        try {
            if (currentPassword == null || currentPassword.isBlank()) {
                throw new BadRequestException("Current password is required.");
            }
            if (newPassword == null || newPassword.isBlank()) {
                throw new BadRequestException("New password is required.");
            }
            if (confirmPassword == null || confirmPassword.isBlank()) {
                throw new BadRequestException("Confirm password is required.");
            }
            if (!newPassword.equals(confirmPassword)) {
                throw new BadRequestException("New password and confirm password must match.");
            }
            if (newPassword.equals(currentPassword)) {
                throw new BadRequestException("New password must differ from current password.");
            }

            if (user.getPasswordHash() == null || !BCrypt.checkpw(currentPassword, user.getPasswordHash())) {
                throw new BadRequestException("Current password is incorrect.");
            }

            user.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
            User saved = userRepository.save(user);

            userAuditEventPublisher.publish("CHANGE_PASSWORD", userId, "SUCCESS", "Password changed");
            return saved;
        } catch (RuntimeException ex) {
            userAuditEventPublisher.publish("CHANGE_PASSWORD", userId, "FAILURE", ex.getMessage());
            throw ex;
        }
    }

    public void deleteUser(Integer userId) {
    }
}
