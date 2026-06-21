package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.UpdateAttendeeHoursRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.EventResponseService;
import com.smartassembly.backend.service.VolunteerHoursService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PostMapping("/{id}/register")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> register(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(responseService.register(id, phoneFrom(auth)));
    }

    @DeleteMapping("/{id}/register")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> cancel(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(responseService.cancel(id, phoneFrom(auth)));
    }

    @GetMapping("/my-responses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> myResponses(Authentication auth) {
        return ResponseEntity.ok(responseService.myResponses(phoneFrom(auth)));
    }

    @GetMapping("/{id}/attendees")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAttendees(@PathVariable Long id) {
        return ResponseEntity.ok(volunteerHoursService.getAttendeesWithHours(id));
    }

    @PostMapping("/{id}/checkin")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> checkIn(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Long userId = Long.valueOf(body.get("userId").toString());
        return ResponseEntity.ok(volunteerHoursService.checkIn(id, phoneFrom(auth), userId));
    }

    @PatchMapping("/{id}/attendees/{userId}/hours")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> updateAttendeeHours(
            @PathVariable Long id,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateAttendeeHoursRequest request,
            Authentication auth) {
        return ResponseEntity.ok(volunteerHoursService.updateAttendeeHours(id, userId, request, phoneFrom(auth)));
    }
}