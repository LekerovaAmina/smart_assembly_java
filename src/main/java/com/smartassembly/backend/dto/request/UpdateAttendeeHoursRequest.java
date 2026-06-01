package com.smartassembly.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendeeHoursRequest {
    /** Время ухода в формате HH:mm (объединяется с датой мероприятия) */
    private String earlyLeaveTime;
    private BigDecimal extraHours;
    private String hoursNote;
}
