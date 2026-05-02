package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.request.CreateEventRequest;
import com.smartassembly.backend.dto.response.EventResponseDto;
import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.EventStatus;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.repository.EventRepository;
import com.smartassembly.backend.repository.EventResponseRepository;
import com.smartassembly.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventResponseRepository eventResponseRepository;

    // ── Создать мероприятие (только HR) ──────────────────────────────────────
    @Transactional
    public EventResponseDto createEvent(CreateEventRequest request, String creatorPhone) {

        // Получаем HR-пользователя из токена
        User creator = userRepository.findByPhone(creatorPhone)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Проверяем права
        if (creator.getRole() != UserRole.HR && creator.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Только HR может создавать мероприятия");
        }

        // Координатор (опционально)
        User coordinator = null;
        if (request.getCoordinatorId() != null) {
            coordinator = userRepository.findById(request.getCoordinatorId())
                    .orElseThrow(() -> new RuntimeException("Координатор с ID " + request.getCoordinatorId() + " не найден"));
        }

        // Спикеры — сохраняем как строку через запятую
        String speakersStr = null;
        if (request.getSpeakers() != null && !request.getSpeakers().isEmpty()) {
            speakersStr = String.join(",", request.getSpeakers());
        }

        // Генерируем QR-код данные (UUID)
        String qrCodeData = UUID.randomUUID().toString();

        Event event = Event.builder()
                .assembly(creator.getAssembly())
                .eventName(request.getEventName())
                .eventType(request.getEventType())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .dressCode(request.getDressCode())
                .objectives(request.getObjectives())
                .tasks(request.getTasks())
                .speakers(speakersStr)
                .coordinator(coordinator)
                .maxParticipants(request.getMaxParticipants())
                .status(EventStatus.DRAFT) // по умолчанию черновик
                .qrCodeData(qrCodeData)
                .createdBy(creator)
                .build();

        Event saved = eventRepository.save(event);
        log.info("Мероприятие '{}' создано HR {} (id={})", saved.getEventName(), creatorPhone, saved.getId());

        return EventResponseDto.from(saved);
    }

    // ── Опубликовать мероприятие (DRAFT → PUBLISHED) ─────────────────────────
    @Transactional
    public EventResponseDto publishEvent(Long eventId, String hrPhone) {
        Event event = getEventOrThrow(eventId);
        checkHrAccess(hrPhone, event);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new RuntimeException("Можно публиковать только черновики");
        }

        event.setStatus(EventStatus.OPEN);
        log.info("Мероприятие id={} опубликовано (OPEN)", eventId);
        return EventResponseDto.from(eventRepository.save(event));
    }

    // ── Отменить мероприятие ──────────────────────────────────────────────────
    @Transactional
    public EventResponseDto cancelEvent(Long eventId, String hrPhone) {
        Event event = getEventOrThrow(eventId);
        checkHrAccess(hrPhone, event);

        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new RuntimeException("Нельзя отменить завершённое мероприятие");
        }

        event.setStatus(EventStatus.CANCELLED);
        log.info("Мероприятие id={} отменено", eventId);
        return EventResponseDto.from(eventRepository.save(event));
    }

    // ── Список мероприятий для HR (все статусы своего отделения) ─────────────
    @Transactional(readOnly = true)
    public List<EventResponseDto> getEventsForHr(String hrPhone) {
        User hr = userRepository.findByPhone(hrPhone)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        return eventRepository
                .findByAssemblyIdOrderByEventDateDesc(hr.getAssembly().getId())
                .stream()
                .map(EventResponseDto::from)
                .toList();
    }

    // ── Список мероприятий для волонтёров (только OPEN и IN_PROGRESS) ──────────
    @Transactional(readOnly = true)
    public List<EventResponseDto> getEventsForVolunteer(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        return eventRepository
                .findByAssemblyIdAndStatusIn(
                        user.getAssembly().getId(),
                        List.of(EventStatus.OPEN, EventStatus.IN_PROGRESS)
                )
                .stream()
                .map(event -> {
                    EventResponseDto dto = EventResponseDto.from(event);
                    // Помечаем — уже записан или нет
                    dto.setIsRegistered(
                            eventResponseRepository.existsByEventIdAndUserId(event.getId(), user.getId())
                    );
                    return dto;
                })
                .toList();
    }

    // ── Получить одно мероприятие по ID ───────────────────────────────────────
    @Transactional(readOnly = true)
    public EventResponseDto getEventById(Long eventId) {
        return EventResponseDto.from(getEventOrThrow(eventId));
    }

    // ── Редактировать мероприятие (только черновик) ───────────────────────────
    @Transactional
    public EventResponseDto updateEvent(Long eventId, CreateEventRequest request, String hrPhone) {
        Event event = getEventOrThrow(eventId);
        checkHrAccess(hrPhone, event);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new RuntimeException("Редактировать можно только черновики");
        }

        User coordinator = null;
        if (request.getCoordinatorId() != null) {
            coordinator = userRepository.findById(request.getCoordinatorId())
                    .orElseThrow(() -> new RuntimeException("Координатор не найден"));
        }

        event.setEventName(request.getEventName());
        event.setEventType(request.getEventType());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setLocation(request.getLocation());
        event.setDressCode(request.getDressCode());
        event.setObjectives(request.getObjectives());
        event.setTasks(request.getTasks());
        event.setSpeakers(request.getSpeakers() != null ? String.join(",", request.getSpeakers()) : null);
        event.setCoordinator(coordinator);
        event.setMaxParticipants(request.getMaxParticipants());

        return EventResponseDto.from(eventRepository.save(event));
    }

    // ── Вспомогательные методы ────────────────────────────────────────────────
    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Мероприятие с ID " + eventId + " не найдено"));
    }

    private void checkHrAccess(String phone, Event event) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (user.getRole() != UserRole.HR && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Недостаточно прав");
        }

        // HR видит только своё отделение
        if (user.getRole() == UserRole.HR &&
                !event.getAssembly().getId().equals(user.getAssembly().getId())) {
            throw new RuntimeException("Нет доступа к мероприятиям другого отделения");
        }
    }
}