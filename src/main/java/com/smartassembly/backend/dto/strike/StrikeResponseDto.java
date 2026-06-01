package com.smartassembly.backend.dto.strike;

import com.smartassembly.backend.enums.AppealStatus;
import com.smartassembly.backend.enums.StrikeSeverity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StrikeResponseDto {
    private Long id;
    private Long volunteerId;
    private String volunteerName;
    private String reason;
    private StrikeSeverity severity;
    private Long eventId;
    private String eventName;
    private Boolean isActive;
    private Boolean isAppealed;
    private LocalDateTime issuedAt;
    private Long issuedById;
    private String issuedByName;
    private LocalDateTime removedAt;
    private AppealStatus appealStatus;
}
