package com.smartassembly.backend.entity;

import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    // Региональное отделение
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assembly_id", nullable = false)
    private Assembly assembly;

    // Уникальный ID формата AJ-AS-000001 (генерируется при approve)
    @Column(name = "unique_id", unique = true)
    private String uniqueId;

    // Персональные данные
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "phone", unique = true, nullable = false)
    private String phone;

    // Telegram (опционально)
    @Column(name = "telegram_id", unique = true)
    private Long telegramId;

    @Column(name = "telegram_username")
    private String telegramUsername;

    // Статус и роль
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.VOLUNTEER;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @Builder.Default
    private UserRole role = UserRole.VOLUNTEER;

    // Волонтёрские метрики
    @Column(name = "total_volunteer_hours", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalVolunteerHours = BigDecimal.ZERO;

    @Column(name = "monthly_volunteer_hours", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal monthlyVolunteerHours = BigDecimal.ZERO;

    @Column(name = "total_strikes")
    @Builder.Default
    private Integer totalStrikes = 0;

    @Column(name = "active_strikes")
    @Builder.Default
    private Integer activeStrikes = 0;

    // Флаги
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = false; // false до одобрения HR

    // Вход по email+паролю
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "password_set_at")
    private LocalDateTime passwordSetAt;

    @CreationTimestamp
    @Column(name = "registration_date", updatable = false)
    private LocalDateTime registrationDate;

    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    // --- 28.04.2026 новые столбцы из таблицы гугл ---
    @Column(name = "birth_date")
    private LocalDate birthDate; // Можно String или LocalDate

    @Column(name = "iin", unique = true)
    private String iin;

    @Column(name = "instagram")
    private String instagram;

    @Column(name = "study_place")
    private String studyPlace;

    @Column(name = "work_place")
    private String workPlace;

    @Column(name = "volunteering_experience", columnDefinition = "TEXT")
    private String volunteeringExperience;

    @Column(name = "hobbies", columnDefinition = "TEXT")
    private String hobbies;

    @Column(name = "free_days")
    private String freeDays;

    @Column(name = "languages")
    private String languages;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "interested_events", columnDefinition = "TEXT")
    private String interestedEvents;

    @Column(name = "discovery_source")
    private String discoverySource;

    @Column(name = "join_reason", columnDefinition = "TEXT")
    private String joinReason;


    // Связи
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<EventResponse> eventResponses;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Strike> strikes;
}