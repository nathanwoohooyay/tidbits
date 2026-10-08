package com.tidbits.audit.model.dto;

import com.tidbits.audit.model.enums.RoleType;

public class UserRoleUpdateRequestDTO {

    private Integer roleId;
    private RoleType roleName;

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public RoleType getRoleName() {
        return roleName;
    }

    public void setRoleName(RoleType roleName) {
        this.roleName = roleName;
    }
}