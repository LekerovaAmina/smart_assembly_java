package com.smartassembly.backend.enums;

public enum RegistrationStatus {
    PENDING,   // Ожидает рассмотрения HR
    APPROVED,  // Принята HR → пользователь активирован
    REJECTED   // Отклонена HR
}