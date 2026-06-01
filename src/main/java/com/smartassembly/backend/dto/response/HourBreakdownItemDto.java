package com.smartassembly.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class HourBreakdownItemDto {
    private String type;
    private String title;
    private LocalDateTime date;
    private BigDecimal hours;
    private String note;
}
