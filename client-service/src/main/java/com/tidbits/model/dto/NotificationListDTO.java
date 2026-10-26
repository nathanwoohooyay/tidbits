package com.tidbits.model.dto;

import java.util.List;

// The newest notifications, plus how many of all the user's notifications are unread.
public record NotificationListDTO(long unreadCount, List<NotificationDTO> items) {
}
