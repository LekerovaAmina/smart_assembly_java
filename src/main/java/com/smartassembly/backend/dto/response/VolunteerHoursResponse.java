package com.smartassembly.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class VolunteerHoursResponse {
    private BigDecimal totalHours;
    private List<HourBreakdownItemDto> breakdown;
}
