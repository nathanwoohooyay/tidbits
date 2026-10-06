package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.UserRoleRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRefRepository extends JpaRepository<UserRoleRef, Integer> {
}