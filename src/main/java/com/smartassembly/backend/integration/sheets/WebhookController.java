package com.smartassembly.backend.integration.sheets;

import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.repository.AssemblyRepository;
import com.smartassembly.backend.repository.RegistrationRequestRepository;
import com.smartassembly.backend.service.GoogleSheetsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

/**
 * Этот контроллер получает данные от Google Apps Script
 * каждый раз, когда кто-то заполняет Google Form.
 *
 * Данные ВСЕГДА попадают в registration_requests со статусом PENDING —
 * HR должен вручную одобрить каждого участника через /api/registration/{id}/approve
 */
@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final RegistrationRequestRepository requestRepository;
    private final AssemblyRepository assemblyRepository;
    private final GoogleSheetsService googleSheetsService;

    @Value("${google.sheets.default-assembly-id}")
    private Long defaultAssemblyId;

    /**
     * POST /api/webhook/sheets
     * Вызывается из Google Apps Script при onFormSubmit.
     * Сохраняет заявку в registration_requests, статус PENDING.
     * HR видит её в /api/registration/pending и принимает решение.
     */
    @PostMapping("/sheets")
    public ResponseEntity<Map<String, Object>> onSheetsRow(@Valid @RequestBody SheetsWebhookDto dto) {
        log.info("Webhook получен: email={}, phone={}", dto.getEmail(), dto.getPhone());

        Assembly assembly = assemblyRepository.findById(defaultAssemblyId)
                .orElseThrow(() -> new IllegalStateException(
                        "Assembly не найден для id=" + defaultAssemblyId));

        // Проверяем дубликат по email
        if (dto.getEmail() != null && requestRepository.existsByEmail(dto.getEmail().trim())) {
            log.warn("Дубликат по email: {}", dto.getEmail());
            return ResponseEntity.ok(Map.of(
                    "status", "duplicate",
                    "reason", "email already exists",
                    "email", dto.getEmail()
            ));
        }

        // Проверяем дубликат по ИИН
        if (dto.getIin() != null && requestRepository.existsByIin(dto.getIin().trim())) {
            log.warn("Дубликат по iin: {}", dto.getIin());
            return ResponseEntity.ok(Map.of(
                    "status", "duplicate",
                    "reason", "iin already exists",
                    "iin", dto.getIin()
            ));
        }

        // Маппим в RegistrationRequest — статус PENDING, HR должен одобрить вручную
        RegistrationRequest request = RegistrationRequestMapper.mapWebhook(dto, assembly);
        RegistrationRequest saved = requestRepository.save(request);

        log.info("Заявка сохранена в registration_requests: id={}, email={}, phone={}",
                saved.getId(), saved.getEmail(), saved.getPhone());

        // Выгружаем заявку в отдельную таблицу Sheets «Заявки на вступление».
        // В таблицу users НЕ пишем — это произойдёт только после одобрения HR.
        try {
            googleSheetsService.appendApplicationRequest(saved);
        } catch (IOException e) {
            log.error("Ошибка выгрузки заявки id={} в Google Sheets (applications): {}",
                    saved.getId(), e.getMessage());
            // Sheets не должен ломать основную логику вебхука.
        }

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "requestId", saved.getId(),
                "message", "Заявка принята. HR рассмотрит её в ближайшее время."
        ));
    }
}