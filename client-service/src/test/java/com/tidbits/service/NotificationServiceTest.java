package com.tidbits.service;

import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.dto.NotificationListDTO;
import com.tidbits.model.entity.Notification;
import com.tidbits.model.enums.NotificationCategory;
import com.tidbits.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void notify_savesTheNotificationWithItsSource() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.notify(7, NotificationCategory.ORDER, "Bought 2 AAPL", "$400.00 at $200.00",
                NotificationService.Source.order(3, 51, "AAPL"));

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(saved.capture());
        Notification n = saved.getValue();
        assertEquals(7, n.getUserId());
        assertEquals(NotificationCategory.ORDER, n.getCategory());
        assertEquals(3, n.getAccountId());
        assertEquals(51, n.getOrderId());
        assertEquals("AAPL", n.getTicker());
        assertNotNull(n.getCreatedAt());
    }

    @Test
    void list_returnsNewestFirstWithUnreadCountAndCapsTheLimit() {
        Notification read = notification(2, LocalDateTime.now());
        Notification unread = notification(1, null);
        when(notificationRepository.findByUserIdOrderByCreatedAtDescNotificationIdDesc(eq(7), any(Pageable.class)))
                .thenReturn(List.of(read, unread));
        when(notificationRepository.countByUserIdAndReadAtIsNull(7)).thenReturn(4L);

        NotificationListDTO result = notificationService.list(7, 5000);

        assertEquals(4L, result.unreadCount());
        assertEquals(2, result.items().size());
        assertTrue(result.items().get(0).read());
        assertFalse(result.items().get(1).read());
        verify(notificationRepository).findByUserIdOrderByCreatedAtDescNotificationIdDesc(7, PageRequest.of(0, NotificationService.MAX_LIMIT));
    }

    @Test
    void markRead_onlyTouchesTheUsersOwnNotification() {
        when(notificationRepository.findByNotificationIdAndUserId(9, 7)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> notificationService.markRead(7, 9));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markRead_leavesAnAlreadyReadNotificationAlone() {
        when(notificationRepository.findByNotificationIdAndUserId(9, 7)).thenReturn(Optional.of(notification(9, LocalDateTime.now())));

        notificationService.markRead(7, 9);

        verify(notificationRepository, never()).save(any());
    }

    private static Notification notification(int id, LocalDateTime readAt) {
        Notification n = new Notification();
        n.setNotificationId(id);
        n.setUserId(7);
        n.setCategory(NotificationCategory.CASH);
        n.setTitle("Deposited $10.00");
        n.setCreatedAt(LocalDateTime.now());
        n.setReadAt(readAt);
        return n;
    }
}
