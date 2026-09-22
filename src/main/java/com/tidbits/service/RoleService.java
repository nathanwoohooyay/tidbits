package com.tidbits.service;

import com.tidbits.model.entity.Role;
import com.tidbits.model.enums.RoleType;
import com.tidbits.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    public Role createRole(Role role) {
        return null;
    }

    public Optional<Role> getRoleById(Integer roleId) {
        return Optional.empty();
    }

    public Optional<Role> getRoleByName(RoleType name) {
        return Optional.empty();
    }

    public List<Role> getAllRoles() {
        return List.of();
    }

    public Role updateRole(Integer roleId, Role role) {
        return null;
    }

    public void deleteRole(Integer roleId) {
    }
}
