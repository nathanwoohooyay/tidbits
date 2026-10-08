package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.RefreshTokenRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRefRepository extends JpaRepository<RefreshTokenRef, Integer> {
    void deleteByUserId(Integer userId);
}