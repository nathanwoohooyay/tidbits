package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.Role;
import com.tidbits.audit.model.entity.UserRoleRef;
import com.tidbits.audit.model.enums.RoleType;
import com.tidbits.audit.repository.RoleRepository;
import com.tidbits.audit.repository.UserRoleRefRepository;
import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRefRepository userRoleRefRepository;

    public Role createRole(Role role) {
        return roleRepository.save(role);
    }

    public Optional<Role> getRoleById(Integer roleId) {
        return roleRepository.findById(roleId);
    }

    public Optional<Role> getRoleByName(RoleType name) {
        return roleRepository.findByName(name);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Role updateRole(Integer roleId, Role role) {
        role.setRoleId(roleId);
        return roleRepository.save(role);
    }

    public void deleteRole(Integer roleId) {
        roleRepository.deleteById(roleId);
    }

    public Role updateUserRole(Integer userId, Integer roleId, RoleType roleName) {
        if (roleId == null && roleName == null) {
            throw new BadRequestException("Either roleId or roleName must be provided");
        }

        UserRoleRef userRef = userRoleRefRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User role reference not found for userId: " + userId));

        Role role = resolveRole(roleId, roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found for the provided identifier"));

        userRef.setRoleId(role.getRoleId());
        userRoleRefRepository.save(userRef);
        return role;
    }

    private Optional<Role> resolveRole(Integer roleId, RoleType roleName) {
        if (roleId != null) {
            return roleRepository.findById(roleId);
        }

        if (roleName != null) {
            return roleRepository.findByName(roleName);
        }

        return Optional.empty();
    }
}
