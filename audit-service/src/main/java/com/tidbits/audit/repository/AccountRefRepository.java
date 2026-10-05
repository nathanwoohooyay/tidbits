package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.AccountRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRefRepository extends JpaRepository<AccountRef, Integer> {
}
