package com.smartassembly.backend.entity;

import com.smartassembly.backend.enums.EventStatus;
import com.smartassembly.backend.enums.EventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assembly_id", nullable = false)
    private Assembly assembly;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Детали
    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "dress_code")
    private String dressCode;

    @Column(name = "objectives", columnDefinition = "TEXT")
    private String objectives;

    @Column(name = "tasks", columnDefinition = "TEXT")
    private String tasks;

    @Column(name = "speakers", columnDefinition = "TEXT")
    private String speakers;

    // Координатор мероприятия
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coordinator_id")
    private User coordinator;

    // Лимиты участников
    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants;

    @Column(name = "current_participants")
    @Builder.Default
    private Integer currentParticipants = 0;

    // Статус
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    // QR код
    @Column(name = "qr_code_data", unique = true)
    private String qrCodeData; // UUID для QR

    @Column(name = "qr_code_url")
    private String qrCodeUrl;

    // Фактическое время (заполняется по факту)
    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    // Кто создал
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Связи
    @OneToMany(mappedBy = "event", fetch = FetchType.LAZY)
    private List<EventResponse> responses;

    // Хелпер — полный набор?
    public boolean isFull() {
        return currentParticipants >= maxParticipants;
    }
}