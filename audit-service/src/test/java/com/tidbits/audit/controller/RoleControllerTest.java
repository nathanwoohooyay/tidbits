package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.RoleDTO;
import com.tidbits.audit.model.dto.UserRoleUpdateRequestDTO;
import com.tidbits.audit.model.entity.Role;
import com.tidbits.audit.model.enums.RoleType;
import com.tidbits.audit.service.RoleService;
import com.tidbits.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleControllerTest {

    @Mock
    private RoleService roleService;

    @InjectMocks
    private RoleController roleController;

    @Test
    void getRoleById_returnsDtoWhenFound() {
        when(roleService.getRoleById(1)).thenReturn(Optional.of(new Role(1, RoleType.ADMIN)));

        ResponseEntity<RoleDTO> response = roleController.getRoleById(1);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getRoleId());
        assertEquals(RoleType.ADMIN, response.getBody().getName());
    }

    @Test
    void getRoleById_throwsWhenMissing() {
        when(roleService.getRoleById(2)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> roleController.getRoleById(2));
    }

    @Test
    void getAllRoles_returnsMappedDtos() {
        when(roleService.getAllRoles()).thenReturn(List.of(new Role(1, RoleType.ADMIN), new Role(2, RoleType.AUDITOR)));

        ResponseEntity<List<RoleDTO>> response = roleController.getAllRoles();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
        assertEquals(RoleType.AUDITOR, response.getBody().get(1).getName());
    }

    @Test
    void updateUserRole_delegatesToServiceAndReturnsDto() {
        UserRoleUpdateRequestDTO request = new UserRoleUpdateRequestDTO();
        request.setRoleId(2);
        request.setRoleName(RoleType.AUDITOR);
        when(roleService.updateUserRole(9, 2, RoleType.AUDITOR)).thenReturn(new Role(2, RoleType.AUDITOR));

        ResponseEntity<RoleDTO> response = roleController.updateUserRole(9, request);

        verify(roleService).updateUserRole(9, 2, RoleType.AUDITOR);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().getRoleId());
        assertEquals(RoleType.AUDITOR, response.getBody().getName());
    }
}
