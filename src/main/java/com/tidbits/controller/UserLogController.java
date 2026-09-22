package com.tidbits.controller;

import com.tidbits.model.entity.UserLog;
import com.tidbits.service.UserLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-logs")
public class UserLogController {

    @Autowired
    private UserLogService userLogService;

    @PostMapping
    public ResponseEntity<UserLog> createUserLog(@RequestBody UserLog userLog) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserLog> getUserLogById(@PathVariable Integer id) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<UserLog>> getAllUserLogs() {
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserLog> updateUserLog(@PathVariable Integer id, @RequestBody UserLog userLog) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserLog(@PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }
}
