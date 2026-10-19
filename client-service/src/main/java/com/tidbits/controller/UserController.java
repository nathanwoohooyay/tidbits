package com.tidbits.controller;

import com.tidbits.model.dto.ChangePasswordDTO;
import com.tidbits.model.dto.UserCreateRequestDTO;
import com.tidbits.model.dto.UserDTO;
import com.tidbits.model.dto.UserUpdateDTO;
import com.tidbits.mapper.UserMapper;
import com.tidbits.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{userId}")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Integer userId) {
        return ResponseEntity.ok(UserMapper.toUserDTO(userService.getUserById(userId).orElse(null)));
    }

    @PatchMapping("/{userId}/change-email")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<UserDTO> changeEmail(@PathVariable Integer userId, @RequestBody UserUpdateDTO request) {
        return ResponseEntity.ok(UserMapper.toUserDTO(userService.changeEmail(userId, request.getEmail())));
    }

    @PatchMapping("/{userId}/change-phone-number")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<UserDTO> changePhoneNumber(@PathVariable Integer userId, @RequestBody UserUpdateDTO request) {
        return ResponseEntity.ok(UserMapper.toUserDTO(userService.changePhoneNumber(userId, request.getPhoneNumber())));
    }
}
