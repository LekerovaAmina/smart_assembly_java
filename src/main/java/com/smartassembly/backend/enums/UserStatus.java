package com.smartassembly.backend.enums;

public enum UserStatus {
    // Legacy статусы (используются в существующем коде)
    MEMBER_OF_BOARD,
    ACTIVIST,
    VOLUNTEER,

    // Статусы из Google Sheets (цвет строк)
    ACTIVE,
    ECO_YOUTH,
    BOARD_MEMBER,
    LEFT,
    REMOTE,

    // Управление аккаунтом (API)
    INACTIVE,
    BANNED
}