package com.smartassembly.backend.enums;

public enum EventStatus {
    DRAFT,        // Черновик
    OPEN,         // Открыта запись
    CLOSED,       // Запись закрыта (набор полный)
    IN_PROGRESS,  // Идёт прямо сейчас
    COMPLETED,    // Завершено
    CANCELLED     // Отменено
}