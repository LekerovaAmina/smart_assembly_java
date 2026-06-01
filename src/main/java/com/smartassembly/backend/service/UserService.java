package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.user.UserResponseDto;
import com.smartassembly.backend.dto.user.UserUpdateRoleRequest;
import com.smartassembly.backend.dto.user.UserUpdateStatusRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.UserAccountStatus;
import com.smartassembly.backend.enums.UserApiRole;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
import com.smartassembly.backend.repository.StrikeRepository;
import com.smartassembly.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final StrikeRepository strikeRepository;
    private final VolunteerHoursService volunteerHoursService;

    @Transactional(readOnly = true)
    public Page<UserResponseDto> listUsers(
            User currentUser,
            UserStatus status,
            UserRole role,
            String search,
            Pageable pageable) {

        requireHrOrAdmin(currentUser);

        Specification<User> spec = buildUserSpecification(currentUser, status, role, search);
        return userRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserById(Long id, User currentUser) {
        requireHrOrAdmin(currentUser);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (currentUser.getRole() == UserRole.HR
                && !user.getAssembly().getId().equals(currentUser.getAssembly().getId())) {
            throw new RuntimeException("Нет доступа к пользователям другого отделения");
        }

        return toDto(user);
    }

    @Transactional(readOnly = true)
    public UserResponseDto getCurrentUser(User currentUser) {
        return toDto(currentUser);
    }

    @Transactional
    public UserResponseDto updateStatus(Long id, UserUpdateStatusRequest request, User admin) {
        requireAdmin(admin);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        applyAccountStatus(user, request.getStatus());
        user = userRepository.save(user);

        log.info("User {} status updated to {} by {}", id, request.getStatus(), admin.getId());
        return toDto(user);
    }

    @Transactional
    public UserResponseDto updateRole(Long id, UserUpdateRoleRequest request, User admin) {
        requireAdmin(admin);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setRole(mapApiRole(request.getRole()));
        user = userRepository.save(user);

        log.info("User {} role updated to {} by {}", id, user.getRole(), admin.getId());
        return toDto(user);
    }

    private Specification<User> buildUserSpecification(
            User currentUser, UserStatus status, UserRole role, String search) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (currentUser.getRole() == UserRole.HR) {
                predicates.add(cb.equal(root.get("assembly").get("id"), currentUser.getAssembly().getId()));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate firstName = cb.like(cb.lower(root.get("firstName")), pattern);
                Predicate lastName = cb.like(cb.lower(root.get("lastName")), pattern);
                Predicate phone = cb.like(root.get("phone"), "%" + search.trim() + "%");
                Predicate uniqueId = cb.like(cb.lower(root.get("uniqueId")), pattern);
                predicates.add(cb.or(firstName, lastName, phone, uniqueId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void applyAccountStatus(User user, UserAccountStatus accountStatus) {
        switch (accountStatus) {
            case ACTIVE -> {
                user.setStatus(UserStatus.ACTIVE);
                user.setIsActive(true);
            }
            case INACTIVE -> {
                user.setStatus(UserStatus.INACTIVE);
                user.setIsActive(false);
            }
            case BANNED -> {
                user.setStatus(UserStatus.BANNED);
                user.setIsActive(false);
            }
        }
    }

    private UserRole mapApiRole(UserApiRole apiRole) {
        return switch (apiRole) {
            case VOLUNTEER -> UserRole.VOLUNTEER;
            case HR -> UserRole.HR;
            case ADMIN -> UserRole.SUPER_ADMIN;
        };
    }

    private UserResponseDto toDto(User user) {
        long strikeCount = strikeRepository.countByUserIdAndIsActiveTrue(user.getId());

        return UserResponseDto.builder()
                .id(user.getId())
                .uniqueId(user.getUniqueId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .totalHours(volunteerHoursService.getTotalHoursForUser(user.getId()))
                .strikeCount((int) strikeCount)
                .departmentId(user.getAssembly().getId())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private void requireHrOrAdmin(User user) {
        if (user.getRole() != UserRole.HR && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Недостаточно прав");
        }
    }

    private void requireAdmin(User user) {
        if (user.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Только ADMIN может выполнить это действие");
        }
    }
}
