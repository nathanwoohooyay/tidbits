package com.tidbits.controller;

import com.tidbits.model.dto.NotificationListDTO;
import com.tidbits.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{userId}/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<NotificationListDTO> getNotifications(@PathVariable Integer userId,
                                                                @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(notificationService.list(userId, limit));
    }

    @PostMapping("/read-all")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<Void> markAllRead(@PathVariable Integer userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{notificationId}/read")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<Void> markRead(@PathVariable Integer userId, @PathVariable Integer notificationId) {
        notificationService.markRead(userId, notificationId);
        return ResponseEntity.noContent().build();
    }
}
