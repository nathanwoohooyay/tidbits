package com.tidbits.audit.model.dto;

import com.tidbits.audit.model.enums.RoleType;

public class RoleDTO {
    private Integer roleId;
    private RoleType name;

    public RoleDTO() {
    }

    public RoleDTO(Integer roleId, RoleType name) {
        this.roleId = roleId;
        this.name = name;
    }

    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }

    public RoleType getName() { return name; }
    public void setName(RoleType name) { this.name = name; }
}
