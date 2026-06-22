package com.smartassembly.backend.service;

import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleSheetsService {

    private final Sheets sheetsService;

    @Value("${google.sheets.spreadsheet-id}")
    private String spreadsheetId;

    @Value("${google.sheets.applications-spreadsheet-id:}")
    private String applicationsSpreadsheetId;

    // Записать список пользователей (полная перезапись листа)
    public void exportUsers(List<User> users) throws IOException {
        List<List<Object>> rows = new ArrayList<>();

        // Заголовок
        rows.add(List.of("ID", "ФИО", "Телефон", "Email",
                "Статус", "Роль", "Часы всего", "Часы за месяц", "Страйки"));

        // Данные
        for (User user : users) {
            rows.add(List.of(
                    user.getUniqueId() != null ? user.getUniqueId() : "",
                    user.getLastName() + " " + user.getFirstName(),
                    user.getPhone(),
                    user.getEmail(),
                    user.getStatus().name(),
                    user.getRole().name(),
                    user.getTotalVolunteerHours(),
                    user.getMonthlyVolunteerHours(),
                    user.getActiveStrikes()
            ));
        }

        writeToSheet("Пользователи!A1", rows);
        log.info("Экспортировано {} пользователей в Google Sheets", users.size());
    }

    // Записать список мероприятий
    public void exportEvents(List<Event> events) throws IOException {
        List<List<Object>> rows = new ArrayList<>();

        rows.add(List.of("ID", "Название", "Тип", "Дата",
                "Место", "Статус", "Участников", "Макс. участников"));

        for (Event event : events) {
            rows.add(List.of(
                    event.getId(),
                    event.getEventName(),
                    event.getEventType().name(),
                    event.getEventDate().toString(),
                    event.getLocation(),
                    event.getStatus().name(),
                    event.getCurrentParticipants(),
                    event.getMaxParticipants()
            ));
        }

        writeToSheet("Мероприятия!A1", rows);
        log.info("Экспортировано {} мероприятий в Google Sheets", events.size());
    }

    // Добавить одну строку в конец листа (например, новый пользователь)
    public void appendUser(User user) throws IOException {
        List<List<Object>> rows = List.of(List.of(
                user.getUniqueId() != null ? user.getUniqueId() : "",
                user.getLastName() + " " + user.getFirstName(),
                user.getPhone(),
                user.getEmail(),
                user.getStatus().name(),
                user.getRole().name(),
                user.getTotalVolunteerHours(),
                user.getMonthlyVolunteerHours(),
                user.getActiveStrikes()
        ));

        ValueRange body = new ValueRange().setValues(rows);

        sheetsService.spreadsheets().values()
                .append(spreadsheetId, "Пользователи!A1", body)
                .setValueInputOption("USER_ENTERED")
                .setInsertDataOption("INSERT_ROWS")
                .execute();

        log.info("Добавлен пользователь {} в Google Sheets", user.getPhone());
    }

    // Обновить конкретную строку по номеру (например, при изменении часов)
    public void updateUserRow(int rowNumber, User user) throws IOException {
        String range = "Пользователи!A" + rowNumber + ":I" + rowNumber;

        List<List<Object>> rows = List.of(List.of(
                user.getUniqueId() != null ? user.getUniqueId() : "",
                user.getLastName() + " " + user.getFirstName(),
                user.getPhone(),
                user.getEmail(),
                user.getStatus().name(),
                user.getRole().name(),
                user.getTotalVolunteerHours(),
                user.getMonthlyVolunteerHours(),
                user.getActiveStrikes()
        ));

        ValueRange body = new ValueRange().setValues(rows);

        sheetsService.spreadsheets().values()
                .update(spreadsheetId, range, body)
                .setValueInputOption("USER_ENTERED")
                .execute();
    }

    // Добавить заявку на вступление в отдельную таблицу «Заявки на вступление».
    // Вызывается из вебхука Google Forms — заявка ещё не одобрена, пользователь
    // в БД не создан, в таблицу users не пишем.
    public void appendApplicationRequest(RegistrationRequest request) throws IOException {
        if (applicationsSpreadsheetId == null || applicationsSpreadsheetId.isBlank()) {
            log.warn("google.sheets.applications-spreadsheet-id не задан — заявка id={} не выгружена в Sheets",
                    request.getId());
            return;
        }

        String fullName = String.join(" ",
                nullToEmpty(request.getLastName()),
                nullToEmpty(request.getFirstName()),
                nullToEmpty(request.getMiddleName())).trim();

        List<List<Object>> rows = List.of(List.of(
                request.getId() != null ? request.getId() : "",
                fullName,
                nullToEmpty(request.getPhone()),
                nullToEmpty(request.getEmail()),
                nullToEmpty(request.getIin()),
                request.getBirthDate() != null ? request.getBirthDate().toString() : "",
                nullToEmpty(request.getStudyPlace()),
                nullToEmpty(request.getWorkPlace()),
                nullToEmpty(request.getMotivation()),
                request.getStatus() != null ? request.getStatus().name() : "",
                request.getCreatedAt() != null ? request.getCreatedAt().toString() : ""
        ));

        ValueRange body = new ValueRange().setValues(rows);

        sheetsService.spreadsheets().values()
                .append(applicationsSpreadsheetId, "Заявки!A1", body)
                .setValueInputOption("USER_ENTERED")
                .setInsertDataOption("INSERT_ROWS")
                .execute();

        log.info("Добавлена заявка id={} в Google Sheets (applications)", request.getId());
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    // Вспомогательный метод — полная перезапись диапазона
    private void writeToSheet(String range, List<List<Object>> rows) throws IOException {
        ValueRange body = new ValueRange().setValues(rows);

        sheetsService.spreadsheets().values()
                .update(spreadsheetId, range, body)
                .setValueInputOption("USER_ENTERED")
                .execute();
    }
}