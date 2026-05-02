package com.smartassembly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // На какой номер был отправлен код
    @Column(name = "phone", nullable = false)
    private String phone;

    // Сам код (4 цифры)
    @Column(name = "code", nullable = false)
    private String code;

    // Использован ли уже
    @Column(name = "is_used")
    @Builder.Default
    private Boolean isUsed = false;

    // Когда истекает (обычно через 5 минут)
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Проверка — не истёк ли код
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !isUsed && !isExpired();
    }
}