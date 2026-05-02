package com.smartassembly.backend.controller;

import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.EventResponseService;
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
        return ResponseEntity.ok(responseService.getAttendees(id));
    }
}