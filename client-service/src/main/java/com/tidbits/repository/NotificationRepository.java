package com.tidbits.repository;

import com.tidbits.model.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserIdOrderByCreatedAtDescNotificationIdDesc(Integer userId, Pageable pageable);

    Optional<Notification> findByNotificationIdAndUserId(Integer notificationId, Integer userId);

    long countByUserIdAndReadAtIsNull(Integer userId);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :readAt WHERE n.userId = :userId AND n.readAt IS NULL")
    int markAllRead(@Param("userId") Integer userId, @Param("readAt") LocalDateTime readAt);
}
