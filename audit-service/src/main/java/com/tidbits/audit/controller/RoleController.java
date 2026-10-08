package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.RoleDTO;
import com.tidbits.audit.model.dto.UserRoleUpdateRequestDTO;
import com.tidbits.audit.model.entity.Role;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.audit.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping("/{id}")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable Integer id) {
        Role role = roleService.getRoleById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found for id: " + id));
        return ResponseEntity.ok(toDto(role));
    }

    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        List<RoleDTO> roles = roleService.getAllRoles()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<RoleDTO> updateUserRole(
            @PathVariable Integer userId,
            @RequestBody UserRoleUpdateRequestDTO request
    ) {
        Role updatedRole = roleService.updateUserRole(userId, request.getRoleId(), request.getRoleName());
        return ResponseEntity.ok(toDto(updatedRole));
    }

    private RoleDTO toDto(Role role) {
        return new RoleDTO(role.getRoleId(), role.getName());
    }
}
