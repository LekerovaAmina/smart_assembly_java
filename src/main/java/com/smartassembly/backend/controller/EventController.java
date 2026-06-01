package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.CreateEventRequest;
import com.smartassembly.backend.dto.response.EventResponseDto;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.EventService;
import com.smartassembly.backend.service.VolunteerHoursService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final VolunteerHoursService volunteerHoursService;

    // Хелпер — достаём телефон из JWT-аутентификации
    private String phoneFrom(Authentication auth) {
        // JwtFilter кладёт User как principal
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return user.getPhone();
        }
        // fallback — если principal это строка (имя)
        return principal.toString();
    }

    // ── HR: создать мероприятие ───────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<EventResponseDto> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.createEvent(request, phoneFrom(auth)));
    }

    // ── HR: список всех мероприятий отделения ─────────────────────────────────
    @GetMapping("/hr")
    public ResponseEntity<Page<EventResponseDto>> getEventsForHr(
            Authentication auth,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(eventService.getEventsForHr(phoneFrom(auth), pageable));
    }

    // ── Волонтёр: список опубликованных мероприятий ───────────────────────────
    @GetMapping
    public ResponseEntity<Page<EventResponseDto>> getEventsForVolunteer(
            Authentication auth,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(eventService.getEventsForVolunteer(phoneFrom(auth), pageable));
    }

    // ── Получить мероприятие по ID (с проверкой авторизации) ──────────────────
    @GetMapping("/{id}")
    public ResponseEntity<EventResponseDto> getEventById(@PathVariable Long id, Authentication auth) {
        String phone = (auth != null) ? phoneFrom(auth) : null;
        return ResponseEntity.ok(eventService.getEventById(id, phone));
    }

    // ── Обновить мероприятие/черновик (HR) ────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<EventResponseDto> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody CreateEventRequest request,
            Authentication auth) {
        // Вызываем метод сервиса для обновления и передаем телефон пользователя
        return ResponseEntity.ok(eventService.updateEvent(id, request, phoneFrom(auth)));
    }

    // ── HR: опубликовать мероприятие ──────────────────────────────────────────
    @PostMapping("/{id}/publish")
    public ResponseEntity<EventResponseDto> publishEvent(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(eventService.publishEvent(id, phoneFrom(auth)));
    }

    // ── HR: отменить мероприятие ──────────────────────────────────────────────
    @PostMapping("/{id}/cancel")
    public ResponseEntity<EventResponseDto> cancelEvent(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(eventService.cancelEvent(id, phoneFrom(auth)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeEvent(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(volunteerHoursService.completeEvent(id, phoneFrom(auth)));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<EventResponseDto> startEvent(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(eventService.startEvent(id, phoneFrom(auth)));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<EventResponseDto> closeEvent(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(eventService.closeEvent(id, phoneFrom(auth)));
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<Map<String, String>> getEventQr(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(eventService.getEventQrBase64(id, phoneFrom(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDraftEvent(@PathVariable Long id, Authentication auth) {
        eventService.deleteDraftEvent(id, phoneFrom(auth));
        return ResponseEntity.noContent().build();
    }
}