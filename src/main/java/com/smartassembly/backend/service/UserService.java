package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.user.UserResponseDto;
import com.smartassembly.backend.dto.user.UserUpdateRoleRequest;
import com.smartassembly.backend.dto.user.UserUpdateStatusRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
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
                .phone(user.getPhone())
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
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getRole() == UserRole.HR &&
                !currentUser.getAssembly().getId().equals(user.getAssembly().getId())) {
            throw new RuntimeException("Access denied");
        }

        user.setStatus(UserStatus.valueOf(request.getStatus().name())); 
        userRepository.save(user);
        return toDto(user);
    }

    @Transactional
    public UserResponseDto updateRole(Long id, UserUpdateRoleRequest request, User currentUser) {
        if (currentUser.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Only SUPER_ADMIN can change user roles");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(UserRole.valueOf(request.getRole().name()));
        userRepository.save(user);
        return toDto(user);
    }
}