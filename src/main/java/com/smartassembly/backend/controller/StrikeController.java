package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.strike.AppealCreateRequest;
import com.smartassembly.backend.dto.strike.AppealRejectRequest;
import com.smartassembly.backend.dto.strike.AppealResponseDto;
import com.smartassembly.backend.dto.strike.StrikeCreateRequest;
import com.smartassembly.backend.dto.strike.StrikeResponseDto;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.StrikeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/strikes")
@RequiredArgsConstructor
public class StrikeController {

    private final StrikeService strikeService;

    @PostMapping("/{volunteerId}")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<StrikeResponseDto> createStrike(
            @PathVariable Long volunteerId,
            @Valid @RequestBody StrikeCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.createStrike(volunteerId, request, currentUser));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'COORDINATOR', 'MEMBER', 'HR', 'SUPER_ADMIN')")
    public ResponseEntity<List<StrikeResponseDto>> getMyStrikes(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.getMyStrikes(currentUser));
    }

    @GetMapping("/volunteer/{id}")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<List<StrikeResponseDto>> getVolunteerStrikes(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.getStrikesForVolunteer(id, currentUser));
    }

    @DeleteMapping("/{strikeId}")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<StrikeResponseDto> revokeStrike(
            @PathVariable Long strikeId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.revokeStrike(strikeId, currentUser));
    }

    @PostMapping("/{strikeId}/appeal")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'COORDINATOR', 'MEMBER')")
    public ResponseEntity<AppealResponseDto> createAppeal(
            @PathVariable Long strikeId,
            @Valid @RequestBody AppealCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.createAppeal(strikeId, request, currentUser));
    }

    @GetMapping("/appeals/pending")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<List<AppealResponseDto>> getPendingAppeals(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.getPendingAppeals(currentUser));
    }

    @PostMapping("/appeals/{appealId}/approve")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<AppealResponseDto> approveAppeal(
            @PathVariable Long appealId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.approveAppeal(appealId, currentUser));
    }

    @PostMapping("/appeals/{appealId}/reject")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<AppealResponseDto> rejectAppeal(
            @PathVariable Long appealId,
            @Valid @RequestBody AppealRejectRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(strikeService.rejectAppeal(appealId, request.getComment(), currentUser));
    }
}
