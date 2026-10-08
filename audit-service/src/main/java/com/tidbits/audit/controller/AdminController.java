package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.AdminAccountDTO;
import com.tidbits.audit.model.dto.AdminDashboardDTO;
import com.tidbits.audit.model.dto.AdminUserDTO;
import com.tidbits.audit.service.AccessRevocationService;
import com.tidbits.audit.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AdminController {

    @Autowired
    private AccessRevocationService accessRevocationService;

    @Autowired
    private AdminService adminService;

    @PostMapping("/users/{userId}/revoke")
    public ResponseEntity<String> revokeAccess(@PathVariable int userId) {
        accessRevocationService.revokeUserAccess(userId);
        return ResponseEntity.ok("User access revoked");
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<AdminUserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/admin/users/{userId}")
    public ResponseEntity<AdminUserDTO> getUserById(@PathVariable Integer userId) {
        return ResponseEntity.ok(adminService.getUserById(userId));
    }

    @GetMapping("/admin/users/{userId}/accounts")
    public ResponseEntity<List<AdminAccountDTO>> getUserAccounts(@PathVariable Integer userId) {
        return ResponseEntity.ok(adminService.getAccountsByUserId(userId));
    }

    @GetMapping("/admin/dashboard/stats")
    public ResponseEntity<AdminDashboardDTO> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
}