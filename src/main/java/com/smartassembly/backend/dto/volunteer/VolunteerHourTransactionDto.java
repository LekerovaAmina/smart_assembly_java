package com.smartassembly.backend.dto.volunteer;

import com.smartassembly.backend.enums.VolunteerHourHistoryType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class VolunteerHourTransactionDto {
    private Long id;
    private BigDecimal hoursDelta;
    private VolunteerHourHistoryType type;
    private String reason;
    private Long eventId;
    private String eventName;
    private LocalDateTime createdAt;
    private String createdBy;
}
