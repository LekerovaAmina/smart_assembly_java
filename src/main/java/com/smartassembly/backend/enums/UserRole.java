package com.smartassembly.backend.enums;

public enum UserRole {
    VOLUNTEER,     // Обычный волонтёр
    COORDINATOR,   // Координатор (может сканировать QR, корректировать часы)
    HR,            // HR (управление мероприятиями, страйками)
    SUPER_ADMIN    // Доступ ко всем регионам
}