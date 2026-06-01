package com.smartassembly.backend.integration.sheets;

import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.RegistrationRequest;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

public final class RegistrationRequestMapper {

    private RegistrationRequestMapper() {}

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
            DateTimeFormatter.ofPattern("M/d/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
    );

    public static RegistrationRequest mapRow(SheetsRowData row, Assembly assembly) {
        String[] nameParts = parseName(row.getFullName());

        return RegistrationRequest.builder()
                .assembly(assembly)
                .lastName(nameParts[0])
                .firstName(nameParts[1])
                .middleName(nameParts[2])
                .email(clean(row.getEmail()))
                .phone(clean(row.getPhone()))
                .birthDate(parseDate(row.getBirthDate()))
                .iin(clean(row.getIin()))
                .instagram(clean(row.getInstagram()))
                .studyPlace(clean(row.getStudyPlace()))
                .workPlace(clean(row.getWorkPlace()))
                .volunteeringExperience(clean(row.getVolunteeringExperience()))
                .hobbies(clean(row.getHobbies()))
                .freeDays(clean(row.getFreeDays()))
                .languages(clean(row.getLanguages()))
                .photoUrl(clean(row.getPhotoUrl()))
                .interestedEvents(clean(row.getInterestedEvents()))
                .discoverySource(clean(row.getDiscoverySource()))
                .motivation(clean(row.getJoinReason()))
                .build();
    }

    public static RegistrationRequest mapWebhook(SheetsWebhookDto dto, Assembly assembly) {
        String[] nameParts = parseName(dto.getFullName());

        return RegistrationRequest.builder()
                .assembly(assembly)
                .lastName(nameParts[0])
                .firstName(nameParts[1])
                .middleName(nameParts[2])
                .email(clean(dto.getEmail()))
                .phone(clean(dto.getPhone()))
                .birthDate(parseDate(dto.getBirthDate()))
                .iin(clean(dto.getIin()))
                .instagram(clean(dto.getInstagram()))
                .studyPlace(clean(dto.getStudyPlace()))
                .workPlace(clean(dto.getWorkPlace()))
                .volunteeringExperience(clean(dto.getVolunteeringExperience()))
                .hobbies(clean(dto.getHobbies()))
                .freeDays(clean(dto.getFreeDays()))
                .languages(clean(dto.getLanguages()))
                .photoUrl(clean(dto.getPhotoUrl()))
                .interestedEvents(clean(dto.getInterestedEvents()))
                .discoverySource(clean(dto.getDiscoverySource()))
                .motivation(clean(dto.getJoinReason()))
                .build();
    }

    private static String[] parseName(String fullName) {
        String last = null, first = null, middle = null;
        if (fullName != null && !fullName.isBlank()) {
            String[] parts = fullName.trim().split("\\s+", 3);
            if (parts.length >= 1) last   = parts[0];
            if (parts.length >= 2) first  = parts[1];
            if (parts.length >= 3) middle = parts[2];
        }
        return new String[]{last, first, middle};
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try { return LocalDate.parse(raw.trim(), fmt); }
            catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private static String clean(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}