package com.tidbits.service;

import com.tidbits.model.entity.User;
import com.tidbits.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

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
        return null;
    }

    public void deleteUser(Integer userId) {
    }
}
