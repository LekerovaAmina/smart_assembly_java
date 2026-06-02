package com.smartassembly.backend.integration.sheets;

import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.repository.AssemblyRepository;
import com.smartassembly.backend.repository.RegistrationRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

/**
 * Одноразовый импорт существующих участников из Google Sheets.
 *
 * ВАЖНО: данные попадают в registration_requests, а НЕ напрямую в users.
 * HR видит все импортированные записи в /api/registration/pending
 * и принимает решение по каждой.
 *
 * Исключение: если rowColorHex указывает на LEFT (#FF0000) — такие строки
 * пропускаются (человек уже выбыл из организации).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserMigrationService {

    private final GoogleSheetsImportService sheetsImportService;
    private final RegistrationRequestRepository requestRepository;
    private final AssemblyRepository assemblyRepository;

    @Value("${google.sheets.default-assembly-id}")
    private Long defaultAssemblyId;

    @Transactional
    public MigrationResult migrateAllFromSheets() throws IOException {
        Assembly assembly = assemblyRepository.findById(defaultAssemblyId)
                .orElseThrow(() -> new IllegalStateException(
                        "Assembly не найден для id=" + defaultAssemblyId));

        List<SheetsRowData> rows = sheetsImportService.getAllRows();

        int imported = 0;
        int skipped = 0;
        int duplicates = 0;
        int leftSkipped = 0;

        for (SheetsRowData row : rows) {
            // Пропускаем выбывших (красный цвет = LEFT)
            String hex = row.getRowBackgroundHex();
            if ("#FF0000".equalsIgnoreCase(hex)) {
                leftSkipped++;
                log.debug("Пропущена строка (LEFT): {}", row.getEmail());
                continue;
            }

            String email = row.getEmail();
            String phone = row.getPhone();

            // Email и телефон обязательны
            if (email == null || phone == null) {
                skipped++;
                continue;
            }

            // Проверяем дубликаты в registration_requests
            if (requestRepository.existsByEmail(email.trim())) {
                duplicates++;
                log.debug("Дубликат по email: {}", email);
                continue;
            }
            if (row.getIin() != null && requestRepository.existsByIin(row.getIin().trim())) {
                duplicates++;
                log.debug("Дубликат по iin: {}", row.getIin());
                continue;
            }

            // Маппим в RegistrationRequest — статус PENDING
            RegistrationRequest request = RegistrationRequestMapper.mapRow(row, assembly);
            requestRepository.save(request);
            imported++;
        }

        log.info("Миграция завершена: импортировано={}, дубликатов={}, " +
                        "пропущено без email/phone={}, пропущено LEFT={}",
                imported, duplicates, skipped, leftSkipped);

        return new MigrationResult(imported, duplicates, skipped, leftSkipped);
    }

    public record MigrationResult(int imported, int duplicates, int skipped, int leftSkipped) {}
}