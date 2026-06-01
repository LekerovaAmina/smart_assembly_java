package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.AdjustVolunteerHoursRequest;
import com.smartassembly.backend.dto.response.VolunteerHoursResponse;
import com.smartassembly.backend.dto.volunteer.VolunteerHourTransactionDto;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.entity.VolunteerHourTransaction;
import com.smartassembly.backend.enums.VolunteerHourHistoryType;
import com.smartassembly.backend.service.VolunteerHoursService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/volunteers")
@RequiredArgsConstructor
public class VolunteerController {

    private final VolunteerHoursService volunteerHoursService;

    private String phoneFrom(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return user.getPhone();
        }
        return principal.toString();
    }

    @GetMapping("/me/hours")
    public ResponseEntity<VolunteerHoursResponse> getMyHours(Authentication auth) {
        return ResponseEntity.ok(volunteerHoursService.getMyHours(phoneFrom(auth)));
    }

    @PostMapping("/{volunteerId}/hours/adjust")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> adjustHours(
            @PathVariable Long volunteerId,
            @Valid @RequestBody AdjustVolunteerHoursRequest request,
            Authentication auth) {
        VolunteerHourTransaction tx = volunteerHoursService.adjustHours(
                volunteerId, request, phoneFrom(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Корректировка сохранена",
                "transactionId", tx.getId(),
                "hoursDelta", tx.getHoursDelta(),
                "volunteerId", volunteerId
        ));
    }

    @GetMapping("/me/hours/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<VolunteerHourTransactionDto>> getMyHoursHistory(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) VolunteerHourHistoryType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(volunteerHoursService.getHoursHistory(
                currentUser.getId(), currentUser, type, from, to, pageable));
    }

    @GetMapping("/{id}/hours/history")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<Page<VolunteerHourTransactionDto>> getVolunteerHoursHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) VolunteerHourHistoryType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(volunteerHoursService.getHoursHistory(
                id, currentUser, type, from, to, pageable));
    }
}
