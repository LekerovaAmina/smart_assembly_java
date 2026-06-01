package com.smartassembly.backend.entity;

import com.smartassembly.backend.enums.ResponseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "event_responses",
        uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ResponseStatus status = ResponseStatus.REGISTERED;

    @Column(name = "response_time")
    private LocalDateTime responseTime; // Когда откликнулся

    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime; // Когда отсканировал QR (legacy)

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "early_leave_time")
    private LocalDateTime earlyLeaveTime;

    @Column(name = "extra_hours", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal extraHours = BigDecimal.ZERO;

    @Column(name = "calculated_hours", precision = 4, scale = 2)
    private BigDecimal calculatedHours;

    @Column(name = "hours_note", length = 255)
    private String hoursNote;

    // Волонтёрские часы за это мероприятие
    @Column(name = "volunteer_hours", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal volunteerHours = BigDecimal.ZERO;

    @Column(name = "hours_manually_adjusted")
    @Builder.Default
    private Boolean hoursManuallyAdjusted = false;

    // Кто скорректировал часы
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adjusted_by")
    private User adjustedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}