package com.smartassembly.backend.entity;

import com.smartassembly.backend.enums.StrikeSeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "strikes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Strike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "strike_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(name = "reason", columnDefinition = "TEXT")
    @Builder.Default
    private String reason = "Не явился на мероприятие";

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    @Builder.Default
    private StrikeSeverity severity = StrikeSeverity.STRIKE;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_appealed")
    @Builder.Default
    private Boolean isAppealed = false;

    @CreationTimestamp
    @Column(name = "issued_at", updatable = false)
    private LocalDateTime issuedAt;

    // Кто выдал (null = система автоматически)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    private User issuedBy;

    // Снятие страйка
    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "removed_by")
    private User removedBy;

    // Связь с апелляцией
    @OneToOne(mappedBy = "strike", fetch = FetchType.LAZY)
    private StrikeAppeal appeal;
}