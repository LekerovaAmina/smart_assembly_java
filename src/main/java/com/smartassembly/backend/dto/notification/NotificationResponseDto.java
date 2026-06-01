package com.smartassembly.backend.dto.notification;

import com.smartassembly.backend.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponseDto {
    private Long id;
    private String title;
    private String body;
    private NotificationType type;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private Long relatedEntityId;
}
