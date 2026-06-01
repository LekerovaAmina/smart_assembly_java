package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.notification.NotificationResponseDto;
import com.smartassembly.backend.entity.Notification;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.NotificationType;
import com.smartassembly.backend.exception.EntityNotFoundException;
import com.smartassembly.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getMyNotifications(User user, Pageable pageable) {
        return notificationRepository.findByUserIdPaged(user.getId(), pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponseDto markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Уведомление не найдено"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Нет доступа к уведомлению");
        }
        notification.setIsRead(true);
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    private NotificationResponseDto toDto(Notification n) {
        Long relatedId = null;
        if (n.getRelatedEvent() != null) {
            relatedId = n.getRelatedEvent().getId();
        } else if (n.getRelatedStrike() != null) {
            relatedId = n.getRelatedStrike().getId();
        }

        NotificationType type = NotificationType.SYSTEM;
        if (n.getNotificationType() != null) {
            try {
                type = NotificationType.valueOf(n.getNotificationType().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                type = NotificationType.SYSTEM;
            }
        }

        return NotificationResponseDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .body(n.getMessage())
                .type(type)
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .relatedEntityId(relatedId)
                .build();
    }
}
