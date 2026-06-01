package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.RegistrationRequestDto;
import com.smartassembly.backend.dto.response.RegistrationRequestResponseDto;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.smartassembly.backend.enums.RegistrationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registration")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    // Подать заявку (публично — без авторизации)
    @PostMapping("/submit")
    public ResponseEntity<?> submit(@Valid @RequestBody RegistrationRequestDto dto) {
        RegistrationRequest request = registrationService.submitRequest(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Заявка успешно подана! HR рассмотрит её в ближайшее время.",
                "requestId", request.getId()
        ));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<Page<RegistrationRequestResponseDto>> getAll(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) List<RegistrationStatus> status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(registrationService.getAllRequests(currentUser, status, pageable));
    }

    // HR видит ВСЕ pending заявки своего отделения (возвращает DTO)
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<Page<RegistrationRequestResponseDto>> getPending(
            @AuthenticationPrincipal User currentUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(registrationService.getPendingRequestsPage(currentUser, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<RegistrationRequestResponseDto> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(registrationService.getRequestById(id, currentUser));
    }

    // HR одобряет заявку
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<?> approve(@PathVariable Long id,
                                     @AuthenticationPrincipal User currentUser) {
        User newUser = registrationService.approveRequest(id, currentUser);
        return ResponseEntity.ok(Map.of(
                "message", "Заявка одобрена. Пользователь создан.",
                "userId", newUser.getId(),
                "uniqueId", newUser.getUniqueId() != null ? newUser.getUniqueId() : "генерируется"
        ));
    }

    // HR отклоняет заявку
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<?> reject(@PathVariable Long id,
                                    @AuthenticationPrincipal User currentUser,
                                    @RequestBody Map<String, String> body) {
        registrationService.rejectRequest(id, currentUser, body.get("comment"));
        return ResponseEntity.ok(Map.of("message", "Заявка отклонена."));
    }
}