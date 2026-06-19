package com.smartassembly.backend.controller;

import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.EventResponseService;
import com.smartassembly.backend.service.VolunteerHoursService;
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
}