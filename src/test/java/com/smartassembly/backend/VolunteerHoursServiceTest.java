package com.smartassembly.backend.service;

import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.entity.EventResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class VolunteerHoursServiceTest {

    @Test
    void calculateHours_noCheckIn_returnsZero() {
        EventResponse response = new EventResponse();
        response.setCheckInTime(null);

        BigDecimal result = VolunteerHoursService.calculateHours(response, LocalDateTime.now());

        assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void calculateHours_twoHours_returns2() {
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 10, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 1, 12, 0);

        EventResponse response = new EventResponse();
        response.setCheckInTime(start);

        BigDecimal result = VolunteerHoursService.calculateHours(response, end);

        assertThat(result).isEqualByComparingTo(new BigDecimal("2.00"));
    }

    @Test
    void calculateHours_withEarlyLeave_usesEarlyLeaveTime() {
        LocalDateTime checkIn = LocalDateTime.of(2025, 1, 1, 10, 0);
        LocalDateTime earlyLeave = LocalDateTime.of(2025, 1, 1, 11, 0);
        LocalDateTime eventEnd = LocalDateTime.of(2025, 1, 1, 13, 0);

        EventResponse response = new EventResponse();
        response.setCheckInTime(checkIn);
        response.setEarlyLeaveTime(earlyLeave);

        BigDecimal result = VolunteerHoursService.calculateHours(response, eventEnd);

        assertThat(result).isEqualByComparingTo(new BigDecimal("1.00"));
    }

    @Test
    void calculateHours_withExtraHours_addsExtra() {
        LocalDateTime checkIn = LocalDateTime.of(2025, 1, 1, 10, 0);
        LocalDateTime eventEnd = LocalDateTime.of(2025, 1, 1, 12, 0);

        EventResponse response = new EventResponse();
        response.setCheckInTime(checkIn);
        response.setExtraHours(new BigDecimal("0.50"));

        BigDecimal result = VolunteerHoursService.calculateHours(response, eventEnd);

        assertThat(result).isEqualByComparingTo(new BigDecimal("2.50"));
    }
}
