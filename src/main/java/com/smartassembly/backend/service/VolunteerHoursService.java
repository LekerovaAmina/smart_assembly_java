package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.request.AdjustVolunteerHoursRequest;
import com.smartassembly.backend.dto.request.UpdateAttendeeHoursRequest;
import com.smartassembly.backend.dto.response.HourBreakdownItemDto;
import com.smartassembly.backend.dto.response.VolunteerHoursResponse;
import com.smartassembly.backend.dto.volunteer.VolunteerHourTransactionDto;
import com.smartassembly.backend.enums.VolunteerHourHistoryType;
import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.entity.EventResponse;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.entity.VolunteerHourTransaction;
import com.smartassembly.backend.enums.EventStatus;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.repository.EventRepository;
import com.smartassembly.backend.repository.EventResponseRepository;
import com.smartassembly.backend.repository.UserRepository;
import com.smartassembly.backend.repository.VolunteerHourTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VolunteerHoursService {

    private final EventResponseRepository responseRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final VolunteerHourTransactionRepository transactionRepository;

    @Transactional
    public Map<String, Object> checkIn(Long eventId, String actorPhone, Long targetUserId, LocalDateTime checkInTime) {
        User actor = getUserOrThrow(actorPhone);
        Long volunteerId = resolveCheckinUserId(actor, targetUserId);

        Event event = getEventOrThrow(eventId);
        EventResponse response = responseRepository.findByEventIdAndUserId(eventId, volunteerId)
                .orElseThrow(() -> new RuntimeException("Участник не зарегистрирован на это мероприятие"));

        if (response.getCheckInTime() != null) {
            throw new RuntimeException("Уже отмечен");
        }

        LocalDateTime recordedTime = (checkInTime != null) ? checkInTime : LocalDateTime.now();
        response.setCheckInTime(recordedTime);
        responseRepository.save(response);

        log.info("Check-in: event={}, user={}, by={}, time={}", eventId, volunteerId, actorPhone, recordedTime);
        return Map.of(
                "message", "Отметка о прибытии сохранена",
                "eventId", eventId,
                "userId", volunteerId,
                "checkInTime", recordedTime.toString()
        );
    }

    @Transactional
    public Map<String, Object> updateAttendeeHours(
            Long eventId, Long userId, UpdateAttendeeHoursRequest request, String actorPhone) {
        User actor = getUserOrThrow(actorPhone);
        requireHrOrCoordinator(actor);

        Event event = getEventOrThrow(eventId);
        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new RuntimeException("Мероприятие уже завершено — часы нельзя изменить");
        }

        EventResponse response = responseRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Участник не найден"));

        if (request.getEarlyLeaveTime() != null && !request.getEarlyLeaveTime().isBlank()) {
            response.setEarlyLeaveTime(parseEarlyLeave(event.getEventDate(), request.getEarlyLeaveTime()));
        } else if (request.getEarlyLeaveTime() != null && request.getEarlyLeaveTime().isBlank()) {
            response.setEarlyLeaveTime(null);
        }

        if (request.getExtraHours() != null) {
            response.setExtraHours(request.getExtraHours());
        }

        if (request.getHoursNote() != null) {
            String note = request.getHoursNote().trim();
            if (note.length() > 255) {
                throw new RuntimeException("Комментарий не может быть длиннее 255 символов");
            }
            response.setHoursNote(note.isEmpty() ? null : note);
        }

        responseRepository.save(response);
        return attendeeMap(response);
    }

    @Transactional
    public Map<String, Object> completeEvent(Long eventId, String hrPhone) {
        User hr = getUserOrThrow(hrPhone);
        requireHr(hr);

        Event event = getEventOrThrow(eventId);
        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new RuntimeException("Мероприятие уже завершено");
        }
        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new RuntimeException("Нельзя завершить отменённое мероприятие");
        }

        LocalDateTime eventEnd = eventEndDateTime(event);
        List<EventResponse> responses = responseRepository.findByEventId(eventId);

        for (EventResponse response : responses) {
            BigDecimal calculated = calculateHours(response, eventEnd);
            response.setCalculatedHours(calculated);
            response.setVolunteerHours(calculated);
        }
        responseRepository.saveAll(responses);

        event.setStatus(EventStatus.COMPLETED);
        event.setActualEndTime(LocalDateTime.now());
        eventRepository.save(event);

        log.info("Event {} completed by HR {}, {} attendees processed", eventId, hrPhone, responses.size());
        return Map.of(
                "message", "Мероприятие завершено, часы начислены",
                "eventId", eventId,
                "status", EventStatus.COMPLETED.name(),
                "attendeesProcessed", responses.size()
        );
    }

    @Transactional(readOnly = true)
    public VolunteerHoursResponse getMyHours(String phone) {
        User user = getUserOrThrow(phone);
        return buildHoursResponse(user.getId());
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalHoursForUser(Long userId) {
        return buildHoursResponse(userId).getTotalHours();
    }

    @Transactional(readOnly = true)
    public Page<VolunteerHourTransactionDto> getHoursHistory(
            Long volunteerId,
            User requester,
            VolunteerHourHistoryType type,
            LocalDate from,
            LocalDate to,
            Pageable pageable) {

        if (!volunteerId.equals(requester.getId())) {
            requireHr(requester);
            User volunteer = userRepository.findById(volunteerId)
                    .orElseThrow(() -> new RuntimeException("Волонтёр не найден"));
            if (requester.getRole() == UserRole.HR
                    && !volunteer.getAssembly().getId().equals(requester.getAssembly().getId())) {
                throw new RuntimeException("Нет доступа к волонтёрам другого отделения");
            }
        }

        List<VolunteerHourTransactionDto> items = new ArrayList<>();

        if (type == null || type == VolunteerHourHistoryType.EVENT) {
            for (EventResponse er : responseRepository.findByUserIdAndEventStatus(volunteerId, EventStatus.COMPLETED)) {
                if (er.getCalculatedHours() == null) {
                    continue;
                }
                LocalDateTime createdAt = er.getEvent().getEventDate().atStartOfDay();
                if (!inDateRange(createdAt.toLocalDate(), from, to)) {
                    continue;
                }
                items.add(VolunteerHourTransactionDto.builder()
                        .id(er.getId())
                        .hoursDelta(er.getCalculatedHours())
                        .type(VolunteerHourHistoryType.EVENT)
                        .reason("Начисление за мероприятие")
                        .eventId(er.getEvent().getId())
                        .eventName(er.getEvent().getEventName())
                        .createdAt(createdAt)
                        .createdBy(null)
                        .build());
            }
        }

        if (type == null || type == VolunteerHourHistoryType.MANUAL_ADJUSTMENT
                || type == VolunteerHourHistoryType.PENALTY) {
            for (VolunteerHourTransaction tx : transactionRepository.findByVolunteerIdOrderByCreatedAtDesc(volunteerId)) {
                VolunteerHourHistoryType txType = tx.getHoursDelta().compareTo(BigDecimal.ZERO) < 0
                        ? VolunteerHourHistoryType.PENALTY
                        : VolunteerHourHistoryType.MANUAL_ADJUSTMENT;
                if (type != null && type != txType) {
                    continue;
                }
                if (!inDateRange(tx.getCreatedAt() != null ? tx.getCreatedAt().toLocalDate() : null, from, to)) {
                    continue;
                }
                String createdByName = tx.getCreatedBy() != null
                        ? tx.getCreatedBy().getLastName() + " " + tx.getCreatedBy().getFirstName()
                        : null;
                items.add(VolunteerHourTransactionDto.builder()
                        .id(tx.getId())
                        .hoursDelta(tx.getHoursDelta())
                        .type(txType)
                        .reason(tx.getReason())
                        .eventId(tx.getEvent() != null ? tx.getEvent().getId() : null)
                        .eventName(tx.getEvent() != null ? tx.getEvent().getEventName() : null)
                        .createdAt(tx.getCreatedAt())
                        .createdBy(createdByName)
                        .build());
            }
        }

        items.sort(Comparator.comparing(
                VolunteerHourTransactionDto::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), items.size());
        List<VolunteerHourTransactionDto> pageContent =
                start >= items.size() ? List.of() : items.subList(start, end);
        return new PageImpl<>(pageContent, pageable, items.size());
    }

    private boolean inDateRange(LocalDate date, LocalDate from, LocalDate to) {
        if (date == null) {
            return true;
        }
        if (from != null && date.isBefore(from)) {
            return false;
        }
        if (to != null && date.isAfter(to)) {
            return false;
        }
        return true;
    }

    @Transactional
    public VolunteerHourTransaction adjustHours(Long volunteerId, AdjustVolunteerHoursRequest request, String hrPhone) {
        User hr = getUserOrThrow(hrPhone);
        requireHr(hr);

        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new RuntimeException("Волонтёр не найден"));

        Event event = null;
        if (request.getEventId() != null) {
            event = getEventOrThrow(request.getEventId());
        }

        VolunteerHourTransaction tx = VolunteerHourTransaction.builder()
                .volunteer(volunteer)
                .event(event)
                .hoursDelta(request.getHoursDelta())
                .reason(request.getReason().trim())
                .createdBy(hr)
                .build();

        return transactionRepository.save(tx);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendeesWithHours(Long eventId) {
        return responseRepository.findByEventId(eventId).stream()
                .map(this::attendeeMap)
                .toList();
    }

    private VolunteerHoursResponse buildHoursResponse(Long userId) {
        BigDecimal fromEvents = responseRepository.sumCalculatedHoursByUserIdAndEventStatus(
                userId, EventStatus.COMPLETED);
        BigDecimal fromAdjustments = transactionRepository.sumHoursDeltaByVolunteerId(userId);

        BigDecimal total = fromEvents.add(fromAdjustments);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }
        total = total.setScale(2, RoundingMode.HALF_UP);

        List<HourBreakdownItemDto> breakdown = new ArrayList<>();

        for (EventResponse er : responseRepository.findByUserIdAndEventStatus(userId, EventStatus.COMPLETED)) {
            if (er.getCalculatedHours() == null) {
                continue;
            }
            Event e = er.getEvent();
            breakdown.add(HourBreakdownItemDto.builder()
                    .type("EVENT")
                    .title(e.getEventName())
                    .date(e.getEventDate().atStartOfDay())
                    .hours(er.getCalculatedHours())
                    .note(er.getHoursNote())
                    .build());
        }

        for (VolunteerHourTransaction tx : transactionRepository.findByVolunteerIdOrderByCreatedAtDesc(userId)) {
            String title = tx.getEvent() != null
                    ? "Корректировка: " + tx.getEvent().getEventName()
                    : "Ручная корректировка";
            breakdown.add(HourBreakdownItemDto.builder()
                    .type("ADJUSTMENT")
                    .title(title)
                    .date(tx.getCreatedAt())
                    .hours(tx.getHoursDelta())
                    .note(tx.getReason())
                    .build());
        }

        breakdown.sort(Comparator.comparing(HourBreakdownItemDto::getDate,
                Comparator.nullsLast(Comparator.reverseOrder())));

        return VolunteerHoursResponse.builder()
                .totalHours(total)
                .breakdown(breakdown)
                .build();
    }

    private Map<String, Object> attendeeMap(EventResponse r) {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", r.getUser().getId());
        map.put("name", r.getUser().getLastName() + " " + r.getUser().getFirstName());
        map.put("phone", r.getUser().getPhone());
        map.put("uniqueId", r.getUser().getUniqueId() != null ? r.getUser().getUniqueId() : "");
        map.put("status", r.getStatus().name());
        map.put("responseTime", r.getResponseTime() != null ? r.getResponseTime().toString() : "");
        map.put("checkInTime", r.getCheckInTime() != null ? r.getCheckInTime().toString() : null);
        map.put("earlyLeaveTime", r.getEarlyLeaveTime() != null ? r.getEarlyLeaveTime().toString() : null);
        map.put("extraHours", r.getExtraHours() != null ? r.getExtraHours() : BigDecimal.ZERO);
        map.put("calculatedHours", r.getCalculatedHours());
        map.put("hoursNote", r.getHoursNote());
        return map;
    }

    static BigDecimal calculateHours(EventResponse response, LocalDateTime eventEnd) {
        if (response.getCheckInTime() == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        LocalDateTime endPoint = response.getEarlyLeaveTime() != null
                ? response.getEarlyLeaveTime()
                : eventEnd;

        long minutes = Duration.between(response.getCheckInTime(), endPoint).toMinutes();
        if (minutes < 0) {
            minutes = 0;
        }

        BigDecimal baseHours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);

        BigDecimal extra = response.getExtraHours() != null ? response.getExtraHours() : BigDecimal.ZERO;
        BigDecimal total = baseHours.add(extra);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private LocalDateTime eventEndDateTime(Event event) {
        LocalTime end = event.getEndTime() != null ? event.getEndTime()
                : event.getStartTime() != null ? event.getStartTime()
                : LocalTime.of(23, 59);
        return LocalDateTime.of(event.getEventDate(), end);
    }

    private LocalDateTime parseEarlyLeave(LocalDate eventDate, String timeStr) {
        try {
            if (timeStr.contains("T")) {
                return LocalDateTime.parse(timeStr);
            }
            LocalTime time = LocalTime.parse(timeStr.length() == 5 ? timeStr + ":00" : timeStr);
            return LocalDateTime.of(eventDate, time);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Неверный формат времени ухода: " + timeStr);
        }
    }

    private Long resolveCheckinUserId(User actor, Long targetUserId) {
        boolean isHr = actor.getRole() == UserRole.HR || actor.getRole() == UserRole.SUPER_ADMIN;
        if (targetUserId != null) {
            if (!isHr) {
                throw new RuntimeException("Только HR может отмечать других участников");
            }
            if (actor.getRole() == UserRole.HR) {
                User target = userRepository.findById(targetUserId)
                        .orElseThrow(() -> new RuntimeException("Волонтёр не найден"));
                if (!target.getAssembly().getId().equals(actor.getAssembly().getId())) {
                    throw new RuntimeException("Нет доступа к волонтёрам другого отделения");
                }
            }
            return targetUserId;
        }
        return actor.getId();
    }

    private void requireHr(User user) {
        if (user.getRole() != UserRole.HR && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Только HR может выполнить это действие");
        }
    }

    private void requireHrOrCoordinator(User user) {
        if (user.getRole() != UserRole.HR
                && user.getRole() != UserRole.COORDINATOR
                && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Недостаточно прав");
        }
    }

    private User getUserOrThrow(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Мероприятие не найдено"));
    }
}
