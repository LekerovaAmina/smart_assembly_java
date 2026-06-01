package com.smartassembly.backend.enums.converter;

import com.smartassembly.backend.enums.EventStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class EventStatusConverter implements AttributeConverter<EventStatus, String> {

    @Override
    public String convertToDatabaseColumn(EventStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public EventStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        return EventStatus.valueOf(dbData.trim().toUpperCase());
    }
}
