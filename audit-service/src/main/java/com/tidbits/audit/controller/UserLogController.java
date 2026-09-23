package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.UserLogDTO;
import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.audit.service.UserLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs/users")
public class UserLogController {

    @Autowired
    private UserLogService userLogService;

    @PostMapping
    public ResponseEntity<UserLogDTO> createUserLog(@RequestBody UserLog userLog) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserLogDTO> getUserLogById(@PathVariable Integer id) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<UserLogDTO>> getAllUserLogs() {
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserLogDTO> updateUserLog(@PathVariable Integer id, @RequestBody UserLog userLog) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserLog(@PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }
}
