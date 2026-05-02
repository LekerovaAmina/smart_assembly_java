package com.smartassembly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "assemblies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assembly {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assembly_id")
    private Long id;

    @Column(name = "assembly_name", nullable = false)
    private String assemblyName; // "Ассамблея Жастары Акмола"

    @Column(name = "region", nullable = false)
    private String region; // "Акмолинская область"

    @Column(name = "city", columnDefinition = "varchar(100)", nullable = false)
    private String city;

    @Column(name = "city_code", nullable = false, length = 5)
    private String cityCode; // "AS" для Астаны, "AL" для Алматы

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "address")
    private String address;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Связи (для удобства — не загружаются по умолчанию)
    @OneToMany(mappedBy = "assembly", fetch = FetchType.LAZY)
    private List<User> users;

    @OneToMany(mappedBy = "assembly", fetch = FetchType.LAZY)
    private List<Event> events;
}