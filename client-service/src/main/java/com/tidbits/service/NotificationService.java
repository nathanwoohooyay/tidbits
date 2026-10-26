package com.tidbits.service;

import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.dto.NotificationDTO;
import com.tidbits.model.dto.NotificationListDTO;
import com.tidbits.model.entity.Notification;
import com.tidbits.model.enums.NotificationCategory;
import com.tidbits.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    static final int MAX_LIMIT = 100;

    @Autowired
    private NotificationRepository notificationRepository;

    // What a notification points at; any of these may be null.
    public record Source(Integer accountId, Integer orderId, Integer transactionId, String ticker) {
        public static Source order(Integer accountId, Integer orderId, String ticker) {
            return new Source(accountId, orderId, null, ticker);
        }

        public static Source transaction(Integer accountId, Integer transactionId) {
            return new Source(accountId, null, transactionId, null);
        }
    }

    public Notification notify(Integer userId, NotificationCategory category, String title, String message, Source source) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setCategory(category);
        notification.setTitle(title);
        notification.setMessage(message);
        if (source != null) {
            notification.setAccountId(source.accountId());
            notification.setOrderId(source.orderId());
            notification.setTransactionId(source.transactionId());
            notification.setTicker(source.ticker());
        }
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public NotificationListDTO list(Integer userId, int limit) {
        int size = Math.max(1, Math.min(limit, MAX_LIMIT));
        List<NotificationDTO> items = notificationRepository
                .findByUserIdOrderByCreatedAtDescNotificationIdDesc(userId, PageRequest.of(0, size))
                .stream()
                .map(NotificationService::toDto)
                .toList();
        return new NotificationListDTO(notificationRepository.countByUserIdAndReadAtIsNull(userId), items);
    }

    @Transactional
    public void markRead(Integer userId, Integer notificationId) {
        Notification notification = notificationRepository.findByNotificationIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification " + notificationId + " not found."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllRead(Integer userId) {
        notificationRepository.markAllRead(userId, LocalDateTime.now());
    }

    private static NotificationDTO toDto(Notification n) {
        return new NotificationDTO(
                n.getNotificationId(),
                n.getCategory().name(),
                n.getTitle(),
                n.getMessage(),
                n.getAccountId(),
                n.getOrderId(),
                n.getTransactionId(),
                n.getTicker(),
                n.getCreatedAt(),
                n.getReadAt() != null
        );
    }
}
