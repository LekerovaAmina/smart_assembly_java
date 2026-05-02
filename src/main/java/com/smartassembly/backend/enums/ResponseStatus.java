package com.smartassembly.backend.enums;

public enum ResponseStatus {
    REGISTERED,  // Зарегистрировался
    CONFIRMED,   // Подтверждён координатором
    ATTENDED,    // Пришёл (отсканировал QR)
    MISSED       // Не пришёл (получит страйк)
}