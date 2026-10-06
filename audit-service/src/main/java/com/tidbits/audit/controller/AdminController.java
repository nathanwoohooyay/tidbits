package com.tidbits.audit.controller;

import com.tidbits.audit.service.AccessRevocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AdminController {

    @Autowired
    private AccessRevocationService accessRevocationService;

    @PostMapping("/users/{userId}/revoke")
    public ResponseEntity<String> revokeAccess(@PathVariable int userId) {
        accessRevocationService.revokeUserAccess(userId);
        return ResponseEntity.ok("User access revoked");
    }

}