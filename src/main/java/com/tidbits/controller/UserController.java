package com.tidbits.controller;

import com.tidbits.model.dto.ChangePasswordDTO;
import com.tidbits.model.entity.User;
import com.tidbits.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable Integer userId) {
        return ResponseEntity.ok(userService.getUserById(userId).orElse(null));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<User> updateUser(@PathVariable Integer userId, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(userId, user));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<User> partiallyUpdateUser(@PathVariable Integer userId, @RequestBody User user) {
        return ResponseEntity.ok(userService.partiallyUpdateUser(userId, user));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/change-password")
    public ResponseEntity<User> changePassword(@PathVariable Integer userId, @RequestBody ChangePasswordDTO changePasswordDTO) {
        return ResponseEntity.ok(userService.changePassword(userId, changePasswordDTO.getNewPassword(), changePasswordDTO.getOldPassword(), changePasswordDTO.getConfirmPassword()));
    }
}
