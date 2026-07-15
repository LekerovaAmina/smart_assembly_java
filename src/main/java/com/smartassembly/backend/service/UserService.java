package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.user.UserAdminSetPasswordRequest;
import com.smartassembly.backend.dto.user.UserAdminUpdateRequest;
import com.smartassembly.backend.dto.user.UserResponseDto;
import com.smartassembly.backend.dto.user.UserUpdateRoleRequest;
import com.smartassembly.backend.dto.user.UserUpdateStatusRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.AuditAction;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
import com.smartassembly.backend.exception.DuplicateEntityException;
import com.smartassembly.backend.exception.EntityNotFoundException;
import com.smartassembly.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<UserResponseDto> listUsers(
            User currentUser,
            UserStatus status,
            UserRole role,
            String search,
            Pageable pageable) {

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("firstName")), pattern),
                        cb.like(cb.lower(root.get("lastName")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                ));
            }

            if (currentUser.getRole() == UserRole.HR) {
                predicates.add(cb.equal(root.get("assembly").get("id"), currentUser.getAssembly().getId()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> users = userRepository.findAll(spec, pageable);
        return users.map(this::toDto);
    }

    private UserResponseDto toDto(User user) {
        if (user == null) return null;

        return UserResponseDto.builder()
                .id(user.getId())
                .uniqueId(user.getUniqueId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .middleName(user.getMiddleName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .totalHours(user.getTotalVolunteerHours())
                .strikeCount(user.getActiveStrikes())
                .departmentId(user.getAssembly() != null ? user.getAssembly().getId() : null)
                .createdAt(user.getRegistrationDate())
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponseDto getCurrentUser(User currentUser) {
        if (currentUser == null) {
            throw new RuntimeException("User not found");
        }
        return toDto(currentUser);
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserById(Long id, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User with id " + id + " not found"));

        if (currentUser.getRole() == UserRole.HR &&
                !currentUser.getAssembly().getId().equals(user.getAssembly().getId())) {
            throw new RuntimeException("Access denied: User is not in your assembly");
        }

        return toDto(user);
    }

    @Transactional
    public UserResponseDto updateStatus(Long id, UserUpdateStatusRequest request, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        if (currentUser.getRole() == UserRole.HR &&
                !currentUser.getAssembly().getId().equals(user.getAssembly().getId())) {
            throw new RuntimeException("Access denied");
        }

        UserStatus oldStatus = user.getStatus();
        UserStatus newStatus = UserStatus.valueOf(request.getStatus().name());
        user.setStatus(newStatus);
        // BANNED/INACTIVE должны реально блокировать вход, не только менять бейдж в таблице
        user.setIsActive(newStatus == UserStatus.ACTIVE);
        userRepository.save(user);
        auditLogService.log(currentUser, AuditAction.STATUS_CHANGE, user, oldStatus + " → " + newStatus);
        return toDto(user);
    }

    @Transactional
    public UserResponseDto updateRole(Long id, UserUpdateRoleRequest request, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        UserRole oldRole = user.getRole();
        user.setRole(request.getRole());
        userRepository.save(user);
        auditLogService.log(currentUser, AuditAction.ROLE_CHANGE, user, oldRole + " → " + request.getRole());
        return toDto(user);
    }

    @Transactional
    public UserResponseDto updateProfile(Long id, UserAdminUpdateRequest request, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        userRepository.findByEmail(request.getEmail())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> { throw new DuplicateEntityException("Email уже используется другим пользователем"); });

        userRepository.findByPhone(request.getPhone())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> { throw new DuplicateEntityException("Телефон уже используется другим пользователем"); });

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setMiddleName(request.getMiddleName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        userRepository.save(user);
        auditLogService.log(currentUser, AuditAction.PROFILE_UPDATE, user, "данные профиля изменены");
        return toDto(user);
    }

    @Transactional
    public void setPassword(Long id, UserAdminSetPasswordRequest request, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordSetAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.log(currentUser, AuditAction.PASSWORD_RESET, user, "пароль изменён администратором");
    }
}