package com.smartassembly.backend.integration.sheets;

import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

public final class UserFromSheetsMapper {
    private UserFromSheetsMapper() {}

    private static final DateTimeFormatter[] TIMESTAMP_FORMATS = new DateTimeFormatter[] {
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy H:mm:ss"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy H:mm"),
            DateTimeFormatter.ofPattern("M/d/yyyy H:mm:ss", Locale.US),
            DateTimeFormatter.ofPattern("M/d/yyyy H:mm", Locale.US),
    };

    private static final DateTimeFormatter[] DATE_FORMATS = new DateTimeFormatter[] {
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
            DateTimeFormatter.ofPattern("d.M.yyyy"),
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("M/d/yyyy", Locale.US),
    };

    public static User mapWebhook(SheetsWebhookDto dto, Assembly assembly) {
        NameParts np = parseFullName(dto.getFullName());
        StatusAndActive sa = statusFromHex(dto.getRowColorHex());

        LocalDateTime registrationDate = parseTimestamp(dto.getTimestamp());
        LocalDate birthDate = parseDate(dto.getBirthDate());

        return User.builder()
                .assembly(assembly)
                .firstName(np.firstName)
                .lastName(np.lastName)
                .middleName(np.middleName)
                .email(normalize(dto.getEmail()))
                .phone(normalizePhone(dto.getPhone()))
                .iin(blankToNull(dto.getIin()))
                .instagram(blankToNull(dto.getInstagram()))
                .studyPlace(blankToNull(dto.getStudyPlace()))
                .workPlace(blankToNull(dto.getWorkPlace()))
                .volunteeringExperience(blankToNull(dto.getVolunteeringExperience()))
                .hobbies(blankToNull(dto.getHobbies()))
                .freeDays(blankToNull(dto.getFreeDays()))
                .languages(blankToNull(dto.getLanguages()))
                .photoUrl(blankToNull(dto.getPhotoUrl()))
                .interestedEvents(blankToNull(dto.getInterestedEvents()))
                .discoverySource(blankToNull(dto.getDiscoverySource()))
                .joinReason(blankToNull(dto.getJoinReason()))
                .birthDate(birthDate)
                .registrationDate(registrationDate)
                .status(sa.status)
                .isActive(sa.isActive)
                .role(UserRole.MEMBER)
                .build();
    }

    public static User mapRow(SheetsRowData row, Assembly assembly) {
        // A..Q indexes
        String timestamp = get(row, 0);
        String fullName = get(row, 1);
        String birthDate = get(row, 2);
        String phone = get(row, 3);
        String iin = get(row, 4);
        String email = get(row, 5);
        String instagram = get(row, 6);
        String study = get(row, 7);
        String work = get(row, 8);
        String exp = get(row, 9);
        String hobbies = get(row, 10);
        String freeDays = get(row, 11);
        String languages = get(row, 12);
        String photo = get(row, 13);
        String interested = get(row, 14);
        String discovery = get(row, 15);
        String joinReason = get(row, 16);

        SheetsWebhookDto dto = new SheetsWebhookDto();
        dto.setTimestamp(timestamp);
        dto.setFullName(fullName);
        dto.setBirthDate(birthDate);
        dto.setPhone(phone);
        dto.setIin(iin);
        dto.setEmail(email);
        dto.setInstagram(instagram);
        dto.setStudyPlace(study);
        dto.setWorkPlace(work);
        dto.setVolunteeringExperience(exp);
        dto.setHobbies(hobbies);
        dto.setFreeDays(freeDays);
        dto.setLanguages(languages);
        dto.setPhotoUrl(photo);
        dto.setInterestedEvents(interested);
        dto.setDiscoverySource(discovery);
        dto.setJoinReason(joinReason);
        dto.setRowColorHex(row.getRowBackgroundHex());
        return mapWebhook(dto, assembly);
    }

    private static String get(SheetsRowData row, int idx) {
        if (row == null || row.getValues() == null || idx < 0 || idx >= row.getValues().size()) return null;
        return blankToNull(row.getValues().get(idx));
    }

    @Value
    private static class NameParts {
        String lastName;
        String firstName;
        String middleName;
    }

    private static NameParts parseFullName(String fullName) {
        String cleaned = blankToNull(fullName);
        if (cleaned == null) {
            return new NameParts("", "", null);
        }
        String[] parts = cleaned.trim().split("\\s+");
        String last = parts.length > 0 ? parts[0] : "";
        String first = parts.length > 1 ? parts[1] : "";
        String middle = parts.length > 2 ? parts[2] : null;
        if (middle != null && middle.isBlank()) middle = null;
        return new NameParts(last, first, middle);
    }

    @Value
    private static class StatusAndActive {
        UserStatus status;
        boolean isActive;
    }

    public static StatusAndActive statusFromHex(String hex) {
        String h = normalizeHex(hex);
        if ("#00FF00".equals(h)) return new StatusAndActive(UserStatus.ACTIVE, true);
        if ("#FF00FF".equals(h)) return new StatusAndActive(UserStatus.ECO_YOUTH, true);
        if ("#0000FF".equals(h)) return new StatusAndActive(UserStatus.BOARD_MEMBER, true);
        if ("#FF0000".equals(h)) return new StatusAndActive(UserStatus.LEFT, false);
        return new StatusAndActive(UserStatus.REMOTE, true);
    }

    private static String normalizeHex(String hex) {
        if (hex == null) return null;
        String h = hex.trim().toUpperCase(Locale.ROOT);
        if (!h.startsWith("#")) h = "#" + h;
        if (h.length() == 4) { // #RGB
            char r = h.charAt(1), g = h.charAt(2), b = h.charAt(3);
            h = "#" + r + r + g + g + b + b;
        }
        return h;
    }

    private static LocalDateTime parseTimestamp(String raw) {
        String s = blankToNull(raw);
        if (s == null) return null;
        for (DateTimeFormatter f : TIMESTAMP_FORMATS) {
            try {
                return LocalDateTime.parse(s, f);
            } catch (DateTimeParseException ignored) {}
        }
        // fallback: try parse date-only into start of day
        LocalDate d = parseDate(s);
        return d != null ? d.atStartOfDay() : null;
    }

    private static LocalDate parseDate(String raw) {
        String s = blankToNull(raw);
        if (s == null) return null;
        for (DateTimeFormatter f : DATE_FORMATS) {
            try {
                return LocalDate.parse(s, f);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private static String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String normalizePhone(String phone) {
        String p = blankToNull(phone);
        if (p == null) return null;
        // keep leading +, remove spaces and dashes
        return p.replaceAll("[\\s\\-()]", "");
    }
}

