package com.tidbits.audit.service;

import com.tidbits.audit.model.entity.Role;
import com.tidbits.audit.model.entity.UserRoleRef;
import com.tidbits.audit.model.enums.RoleType;
import com.tidbits.audit.repository.RoleRepository;
import com.tidbits.audit.repository.UserRoleRefRepository;
import com.tidbits.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
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
@DisplayName("RoleService contract tests")
class RoleServiceTest {

	@Mock
	private RoleRepository roleRepository;

	@Mock
	private UserRoleRefRepository userRoleRefRepository;

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
		when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Role result = roleService.updateRole(1, updatedRole);

		assertNotNull(result);
		assertEquals(1, result.getRoleId());
		assertEquals(RoleType.AUDITOR, result.getName());
		verify(roleRepository).save(any(Role.class));
	}

	@Test
	@DisplayName("deleteRole should remove the matching role")
	void deleteRole_shouldRemoveMatchingRole() {
		doNothing().when(roleRepository).deleteById(eq(1));

		roleService.deleteRole(1);

		verify(roleRepository).deleteById(1);
	}

	@Test
	@DisplayName("updateUserRole should update role assignment when user and role exist")
	void updateUserRole_shouldUpdateRoleAssignmentWhenUserAndRoleExist() {
		UserRoleRef userRoleRef = new UserRoleRef();
		userRoleRef.setUserId(99);
		userRoleRef.setRoleId(1);

		Role auditorRole = new Role(2, RoleType.AUDITOR);

		when(userRoleRefRepository.findById(99)).thenReturn(Optional.of(userRoleRef));
		when(roleRepository.findById(2)).thenReturn(Optional.of(auditorRole));
		when(userRoleRefRepository.save(any(UserRoleRef.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Role result = roleService.updateUserRole(99, 2, null);

		assertNotNull(result);
		assertEquals(RoleType.AUDITOR, result.getName());
		assertEquals(2, userRoleRef.getRoleId());
		verify(userRoleRefRepository).save(any(UserRoleRef.class));
	}

	@Test
	@DisplayName("updateUserRole should throw when user is missing")
	void updateUserRole_shouldThrowWhenUserIsMissing() {
		when(userRoleRefRepository.findById(99)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> roleService.updateUserRole(99, 2, null));

		verify(userRoleRefRepository, never()).save(any(UserRoleRef.class));
	}

	@Test
	@DisplayName("updateUserRole should throw when role is missing")
	void updateUserRole_shouldThrowWhenRoleIsMissing() {
		UserRoleRef userRoleRef = new UserRoleRef();
		userRoleRef.setUserId(99);
		userRoleRef.setRoleId(1);

		when(userRoleRefRepository.findById(99)).thenReturn(Optional.of(userRoleRef));
		when(roleRepository.findByName(RoleType.REPORTER)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> roleService.updateUserRole(99, null, RoleType.REPORTER));

		verify(userRoleRefRepository, never()).save(any(UserRoleRef.class));
	}
}
