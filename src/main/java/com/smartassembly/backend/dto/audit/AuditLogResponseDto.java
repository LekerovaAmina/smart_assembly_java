package com.smartassembly.backend.dto.audit;

import com.smartassembly.backend.enums.AuditAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponseDto {
    private Long id;
    private String actorName;
    private String actorRole;
    private AuditAction action;
    private String targetName;
    private String details;
    private LocalDateTime createdAt;
}
