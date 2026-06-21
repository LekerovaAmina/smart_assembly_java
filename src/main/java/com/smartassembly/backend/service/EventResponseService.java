package com.smartassembly.backend.service;

import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.entity.EventResponse;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.EventStatus;
import com.smartassembly.backend.enums.ResponseStatus;
import com.smartassembly.backend.repository.EventRepository;
import com.smartassembly.backend.repository.EventResponseRepository;
import com.smartassembly.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventResponseService {

    private final EventResponseRepository responseRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    // ── Волонтёр: откликнуться на мероприятие ────────────────────────────────
    @Transactional
    public Map<String, Object> register(Long eventId, String phone) {
        User user = getUserOrThrow(phone);
        Event event = getEventOrThrow(eventId);

        // Только на открытые мероприятия
        if (event.getStatus() != EventStatus.OPEN) {
            throw new RuntimeException("Регистрация на это мероприятие закрыта");
        }

        // Проверяем — уже записан?
        if (responseRepository.existsByEventIdAndUserId(eventId, user.getId())) {
            throw new RuntimeException("Вы уже зарегистрированы на это мероприятие");
        }

        // Проверяем лимит участников
        if (event.isFull()) {
            throw new RuntimeException("Мест больше нет (набор полный)");
        }

        EventResponse response = EventResponse.builder()
                .event(event)
                .user(user)
                .status(ResponseStatus.REGISTERED)
                .responseTime(LocalDateTime.now())
                .build();

        responseRepository.save(response);

        // Увеличиваем счётчик участников
        event.setCurrentParticipants(event.getCurrentParticipants() + 1);

        // Если набор заполнен — закрываем запись
        if (event.isFull()) {
            event.setStatus(EventStatus.CLOSED);
        }

        eventRepository.save(event);

        log.info("Волонтёр {} записался на мероприятие id={}", phone, eventId);
        return Map.of(
                "message", "Вы успешно зарегистрированы на мероприятие «" + event.getEventName() + "»",
                "eventId", eventId,
                "status", ResponseStatus.REGISTERED.name()
        );
    }

    // ── Волонтёр: отозвать отклик ─────────────────────────────────────────────
    @Transactional
    public Map<String, Object> cancel(Long eventId, String phone) {
        User user = getUserOrThrow(phone);
        Event event = getEventOrThrow(eventId);

        // 1. Ищем отклик
        EventResponse response = responseRepository.findByEventIdAndUserId(eventId, user.getId())
                .orElseThrow(() -> new RuntimeException("Вы не зарегистрированы на это мероприятие"));

        if (response.getStatus() == ResponseStatus.ATTENDED) {
            throw new RuntimeException("Нельзя отозваться — вы уже были отмечены как пришедший");
        }

        // 2. Удаляем отклик физически
        responseRepository.delete(response);

        // ВАЖНО: Принудительно очищаем очередь удалений, чтобы count ниже был верным
        responseRepository.flush();

        // 3. ПЕРЕСЧИТЫВАЕМ реальное количество участников из таблицы откликов
        long realCount = responseRepository.countByEventId(eventId);
        event.setCurrentParticipants((int) realCount);

        // 4. Проверяем статус
        if (event.getStatus() == EventStatus.CLOSED && realCount < event.getMaxParticipants()) {
            event.setStatus(EventStatus.OPEN);
        }

        eventRepository.save(event);

        log.info("Волонтёр {} отозвал отклик. Теперь участников: {}", phone, realCount);
        return Map.of("message", "Регистрация отменена");
    }

    // ── Волонтёр: мои отклики ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Map<String, Object>> myResponses(String phone) {
        User user = getUserOrThrow(phone);
        return responseRepository.findByUserId(user.getId()).stream()
                .map(r -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("eventId", r.getEvent().getId());
                    m.put("eventName", r.getEvent().getEventName());
                    m.put("eventDate", r.getEvent().getEventDate().toString());
                    m.put("status", r.getStatus().name());
                    m.put("responseTime", r.getResponseTime() != null ? r.getResponseTime().toString() : "");
                    m.put("checkInTime", r.getCheckInTime() != null ? r.getCheckInTime().toString() : null);
                    return m;
                })
                .toList();
    }

    // ── HR: список участников мероприятия ────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendees(Long eventId) {
        return responseRepository.findByEventId(eventId).stream()
                .map(r -> Map.<String, Object>of(
                        "userId", r.getUser().getId(),
                        "name", r.getUser().getLastName() + " " + r.getUser().getFirstName(),
                        "phone", r.getUser().getPhone(),
                        "uniqueId", r.getUser().getUniqueId() != null ? r.getUser().getUniqueId() : "",
                        "status", r.getStatus().name(),
                        "responseTime", r.getResponseTime() != null ? r.getResponseTime().toString() : ""
                ))
                .toList();
    }

    // ── Вспомогательные ──────────────────────────────────────────────────────
    private User getUserOrThrow(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Мероприятие не найдено"));
    }
}