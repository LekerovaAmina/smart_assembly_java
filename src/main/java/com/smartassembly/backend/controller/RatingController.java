package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.user.UserResponseDto;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.repository.StrikeRepository;
import com.smartassembly.backend.repository.UserRepository;
import com.smartassembly.backend.service.VolunteerHoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rating")
@RequiredArgsConstructor
public class RatingController {

    private final UserRepository userRepository;
    private final StrikeRepository strikeRepository;
    private final VolunteerHoursService volunteerHoursService;

    /**
     * Публичный рейтинг волонтёров отделения.
     * Доступен всем авторизованным пользователям (волонтёрам и HR).
     * Берём отделение из токена текущего пользователя.
     */
    @GetMapping
    public ResponseEntity<List<RatingEntryDto>> getRating(
            @AuthenticationPrincipal User currentUser) {

        List<User> users = userRepository
                .findByAssemblyIdAndIsActiveTrue(currentUser.getAssembly().getId());

        List<RatingEntryDto> entries = users.stream()
                .map(u -> {
                    long strikeCount = strikeRepository.countByUserIdAndIsActiveTrue(u.getId());
                    return RatingEntryDto.builder()
                            .id(u.getId())
                            .uniqueId(u.getUniqueId())
                            .firstName(u.getFirstName())
                            .lastName(u.getLastName())
                            .role(u.getRole().name())
                            .status(u.getStatus().name())
                            .totalHours(volunteerHoursService.getTotalHoursForUser(u.getId()))
                            .strikeCount((int) strikeCount)
                            .build();
                })
                .sorted((a, b) -> b.getTotalHours().compareTo(a.getTotalHours()))
                .toList();

        return ResponseEntity.ok(entries);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RatingEntryDto {
        private Long id;
        private String uniqueId;
        private String firstName;
        private String lastName;
        private String role;
        private String status;
        private java.math.BigDecimal totalHours;
        private Integer strikeCount;
    }
}