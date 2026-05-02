package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.CreateEventRequest;
import com.smartassembly.backend.dto.response.EventResponseDto;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

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
        return ResponseEntity.ok(eventService.createEvent(request, phoneFrom(auth)));
    }

    // ── HR: список всех мероприятий отделения ─────────────────────────────────
    @GetMapping("/hr")
    public ResponseEntity<List<EventResponseDto>> getEventsForHr(Authentication auth) {
        return ResponseEntity.ok(eventService.getEventsForHr(phoneFrom(auth)));
    }

    // ── Волонтёр: список опубликованных мероприятий ───────────────────────────
    @GetMapping
    public ResponseEntity<List<EventResponseDto>> getEventsForVolunteer(Authentication auth) {
        return ResponseEntity.ok(eventService.getEventsForVolunteer(phoneFrom(auth)));
    }

    // ── Получить мероприятие по ID ────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<EventResponseDto> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    // ── HR: редактировать черновик ────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<EventResponseDto> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody CreateEventRequest request,
            Authentication auth) {
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
}