package com.tidbits.repository;

import com.tidbits.model.entity.UserLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLogRepository extends JpaRepository<UserLog, Integer> {
    List<UserLog> findByUserId(Integer userId);
}
