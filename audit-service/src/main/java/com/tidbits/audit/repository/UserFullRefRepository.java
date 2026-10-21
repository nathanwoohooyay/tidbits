package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.UserFullRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFullRefRepository extends JpaRepository<UserFullRef, Integer> {
}
