package com.smartassembly.backend.dto.strike;

import com.smartassembly.backend.enums.AppealStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AppealResponseDto {
    private Long id;
    private Long strikeId;
    private Long volunteerId;
    private String volunteerName;
    private String reason;
    private AppealStatus status;
    private String hrComment;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime createdAt;
}
