package com.tidbits.controller;

import com.tidbits.model.dto.ChangePasswordDTO;
import com.tidbits.model.dto.UserCreateRequestDTO;
import com.tidbits.model.dto.UserDTO;
import com.tidbits.model.dto.UserUpdateDTO;
import com.tidbits.mapper.UserMapper;
import com.tidbits.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody UserCreateRequestDTO request) {
        return ResponseEntity.ok(UserMapper.toUserDTO(userService.createUser(UserMapper.toCreateEntity(request))));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Integer userId) {
        return ResponseEntity.ok(UserMapper.toUserDTO(userService.getUserById(userId).orElse(null)));
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers().stream().map(UserMapper::toUserDTO).filter(Objects::nonNull).toList());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Integer userId, @RequestBody UserUpdateDTO request) {
        return ResponseEntity.ok(UserMapper.toUserDTO(userService.updateUser(userId, UserMapper.toUpdateEntity(request))));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<UserDTO> partiallyUpdateUser(@PathVariable Integer userId, @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/change-password")
    public ResponseEntity<UserDTO> changePassword(@PathVariable Integer userId, @RequestBody ChangePasswordDTO changePasswordDTO) {
        return ResponseEntity.ok(null);
    }
}
