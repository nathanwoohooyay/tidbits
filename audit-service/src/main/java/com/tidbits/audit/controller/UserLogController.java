package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.UserLogDTO;
import com.tidbits.audit.model.entity.UserLog;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.audit.service.UserLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs/users")
public class UserLogController {

    @Autowired
    private UserLogService userLogService;

    @PostMapping
    public ResponseEntity<UserLogDTO> createUserLog(@RequestBody UserLog userLog) {
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(userLogService.createUserLog(userLog)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserLogDTO> getUserLogById(@PathVariable Integer id) {
        UserLog log = userLogService.getUserLogById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User log not found for id: " + id));
        return ResponseEntity.ok(toDto(log));
    }

    @GetMapping
    public ResponseEntity<List<UserLogDTO>> getAllUserLogs() {
        return ResponseEntity.ok(userLogService.getAllUserLogs().stream().map(this::toDto).collect(Collectors.toList()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserLogDTO> updateUserLog(@PathVariable Integer id, @RequestBody UserLog userLog) {
        return ResponseEntity.ok(toDto(userLogService.updateUserLog(id, userLog)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserLog(@PathVariable Integer id) {
        userLogService.deleteUserLog(id);
        return ResponseEntity.noContent().build();
    }

    private UserLogDTO toDto(UserLog log) {
        return new UserLogDTO(
                log.getLogId(),
                log.getUserId(),
                log.getUsername(),
                log.getIpAddress(),
                log.getEvent(),
                log.getStatus(),
                log.getHappenedAt()
        );
    }
}
