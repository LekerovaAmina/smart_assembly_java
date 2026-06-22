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
import java.time.format.DateTimeFormatter;
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

    // Форматы соответствуют тому, как Google Forms сама пишет в линкованный лист.
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    // Лист, привязанный к Google Form. Имя в кавычках, потому что содержит пробелы и скобки.
    private static final String APPLICATIONS_SHEET_RANGE = "'Ответы на форму (1)'!A1";

    // Добавить заявку на вступление в лист, привязанный к Google Форме.
    // Порядок колонок ОБЯЗАН совпадать с колонками формы:
    //  A Отметка времени
    //  B Фамилия, имя, отчество (если имеется)
    //  C Дата рождения
    //  D Номер телефона в формате (+7 ХХХ ХХХ ХХ ХХ)
    //  E ИИН
    //  F Адрес электронной почты
    //  G Страница в Instagram
    //  H Место учебы (при наличии)
    //  I Место работы (при наличии)
    //  J Имеется ли опыт в волонтерстве или общественной деятельности?
    //  K Хобби и интересы
    //  L Свободные дни в неделе
    //  M Какими языками владеете и их уровень (А1-А2)
    //  N Фото лица (без фильтров и масок)
    //  O Какие мероприятия Вам интересны?
    //  P Как узнали о нас?
    //  Q Почему вы решили вступить в "Ассамблея Жастары"
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
                request.getCreatedAt() != null ? request.getCreatedAt().format(TS_FMT) : "",
                fullName,
                request.getBirthDate() != null ? request.getBirthDate().format(DATE_FMT) : "",
                nullToEmpty(request.getPhone()),
                nullToEmpty(request.getIin()),
                nullToEmpty(request.getEmail()),
                nullToEmpty(request.getInstagram()),
                nullToEmpty(request.getStudyPlace()),
                nullToEmpty(request.getWorkPlace()),
                nullToEmpty(request.getVolunteeringExperience()),
                nullToEmpty(request.getHobbies()),
                nullToEmpty(request.getFreeDays()),
                nullToEmpty(request.getLanguages()),
                nullToEmpty(request.getPhotoUrl()),
                nullToEmpty(request.getInterestedEvents()),
                nullToEmpty(request.getDiscoverySource()),
                nullToEmpty(request.getMotivation())
        ));

        ValueRange body = new ValueRange().setValues(rows);

        sheetsService.spreadsheets().values()
                .append(applicationsSpreadsheetId, APPLICATIONS_SHEET_RANGE, body)
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