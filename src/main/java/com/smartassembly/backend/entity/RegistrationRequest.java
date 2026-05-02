package com.smartassembly.backend.entity;

import com.smartassembly.backend.enums.RegistrationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;

import java.time.LocalDateTime;

@Entity
@Table(name = "registration_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id") // Проверь, как называется колонка в БД. Если просто "id", убери эту строку
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assembly_id", nullable = false)
    private Assembly assembly;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default // Чтобы builder использовал значение по умолчанию
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "iin")
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

    @Column(name = "motivation", columnDefinition = "TEXT")
    private String motivation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "hr_comment")
    private String hrComment;

    @OneToOne
    @JoinColumn(name = "created_user_id")
    private User createdUser;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}