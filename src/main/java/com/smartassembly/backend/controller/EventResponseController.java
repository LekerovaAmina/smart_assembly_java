package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.CheckinRequest;
import com.smartassembly.backend.dto.request.UpdateAttendeeHoursRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.EventResponseService;
import com.smartassembly.backend.service.VolunteerHoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventResponseController {

    private final EventResponseService responseService;
    private final VolunteerHoursService volunteerHoursService;

    private String phoneFrom(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) return user.getPhone();
        return principal.toString();
    }

    // ── Волонтёр: откликнуться ────────────────────────────────────────────────
    // POST /api/events/{id}/register
    @PostMapping("/{id}/register")
    public ResponseEntity<Map<String, Object>> register(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(responseService.register(id, phoneFrom(auth)));
    }

    // ── Волонтёр: отозвать отклик ─────────────────────────────────────────────
    // DELETE /api/events/{id}/register
    @DeleteMapping("/{id}/register")
    public ResponseEntity<Map<String, Object>> cancel(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(responseService.cancel(id, phoneFrom(auth)));
    }

    // ── Волонтёр: мои отклики ─────────────────────────────────────────────────
    // GET /api/events/my-responses
    @GetMapping("/my-responses")
    public ResponseEntity<List<Map<String, Object>>> myResponses(Authentication auth) {
        return ResponseEntity.ok(responseService.myResponses(phoneFrom(auth)));
    }

    // ── HR/Координатор: список участников мероприятия ────────────────────────
    // GET /api/events/{id}/attendees
    @GetMapping("/{id}/attendees")
    public ResponseEntity<List<Map<String, Object>>> getAttendees(@PathVariable Long id) {
        return ResponseEntity.ok(volunteerHoursService.getAttendeesWithHours(id));
    }

    @PostMapping("/{eventId}/checkin")
    public ResponseEntity<Map<String, Object>> checkIn(
            @PathVariable Long eventId,
            @RequestBody(required = false) CheckinRequest request,
            Authentication auth) {
        Long userId = request != null ? request.getUserId() : null;
        return ResponseEntity.ok(volunteerHoursService.checkIn(eventId, phoneFrom(auth), userId));
    }

    @PatchMapping("/{eventId}/attendees/{userId}/hours")
    public ResponseEntity<Map<String, Object>> updateAttendeeHours(
            @PathVariable Long eventId,
            @PathVariable Long userId,
            @RequestBody UpdateAttendeeHoursRequest request,
            Authentication auth) {
        return ResponseEntity.ok(volunteerHoursService.updateAttendeeHours(
                eventId, userId, request, phoneFrom(auth)));
    }
}