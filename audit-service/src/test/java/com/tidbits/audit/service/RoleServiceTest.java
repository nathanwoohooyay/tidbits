package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.Role;
import com.tidbits.audit.model.enums.RoleType;
import com.tidbits.audit.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Disabled("Enable after RoleService methods are implemented")
@DisplayName("RoleService contract tests")
class RoleServiceTest {

	@Mock
	private RoleRepository roleRepository;

	@InjectMocks
	private RoleService roleService;

	private Role role;
	private Role updatedRole;

	@BeforeEach
	void setUp() {
		role = new Role(1, RoleType.ADMIN);
		updatedRole = new Role(1, RoleType.AUDITOR);
	}

	@Test
	@DisplayName("createRole should persist and return the saved role")
	void createRole_shouldPersistAndReturnSavedRole() {
		when(roleRepository.save(role)).thenReturn(role);

		Role result = roleService.createRole(role);

		assertEquals(role, result);
		verify(roleRepository).save(role);
	}

	@Test
	@DisplayName("getRoleById should return the matching role when found")
	void getRoleById_shouldReturnMatchingRole() {
		when(roleRepository.findById(1)).thenReturn(Optional.of(role));

		Optional<Role> result = roleService.getRoleById(1);

		assertTrue(result.isPresent());
		assertEquals(role, result.orElseThrow());
		verify(roleRepository).findById(1);
	}

	@Test
	@DisplayName("getRoleByName should return the matching role when found")
	void getRoleByName_shouldReturnMatchingRole() {
		when(roleRepository.findByName(RoleType.ADMIN)).thenReturn(Optional.of(role));

		Optional<Role> result = roleService.getRoleByName(RoleType.ADMIN);

		assertTrue(result.isPresent());
		assertEquals(role, result.orElseThrow());
		verify(roleRepository).findByName(RoleType.ADMIN);
	}

	@Test
	@DisplayName("getAllRoles should return every stored role")
	void getAllRoles_shouldReturnEveryStoredRole() {
		when(roleRepository.findAll()).thenReturn(List.of(role, updatedRole));

		List<Role> result = roleService.getAllRoles();

		assertEquals(2, result.size());
		assertEquals(List.of(role, updatedRole), result);
		verify(roleRepository).findAll();
	}

	@Test
	@DisplayName("updateRole should apply changes to an existing role")
	void updateRole_shouldApplyChangesToExistingRole() {
		when(roleRepository.findById(1)).thenReturn(Optional.of(role));
		when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Role result = roleService.updateRole(1, updatedRole);

		assertNotNull(result);
		assertEquals(RoleType.AUDITOR, result.getName());
		verify(roleRepository).findById(1);
		verify(roleRepository).save(any(Role.class));
	}

	@Test
	@DisplayName("deleteRole should remove the matching role")
	void deleteRole_shouldRemoveMatchingRole() {
		doNothing().when(roleRepository).deleteById(eq(1));

		roleService.deleteRole(1);

		verify(roleRepository).deleteById(1);
	}
}
