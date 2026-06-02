package com.smartassembly.backend.integration.sheets;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/sheets")
@RequiredArgsConstructor
public class UserMigrationController {

    private final UserMigrationService userMigrationService;

    /**
     * POST /api/admin/sheets/migrate-users
     * Одноразовый импорт из Google Sheets в registration_requests.
     * После импорта HR видит все записи в разделе "Заявки" и одобряет вручную.
     */
    @PostMapping("/migrate-users")
    public ResponseEntity<Map<String, Object>> migrateUsers() throws IOException {
        UserMigrationService.MigrationResult result = userMigrationService.migrateAllFromSheets();
        return ResponseEntity.ok(Map.of(
                "message", String.format(
                        "Импорт завершён: добавлено %d заявок, дубликатов %d, " +
                                "пропущено без email/phone %d, пропущено LEFT %d",
                        result.imported(), result.duplicates(),
                        result.skipped(), result.leftSkipped()),
                "imported", result.imported(),
                "duplicates", result.duplicates(),
                "skipped", result.skipped(),
                "leftSkipped", result.leftSkipped(),
                "note", "Все записи сохранены в registration_requests со статусом PENDING. " +
                        "HR должен одобрить каждого участника вручную через раздел 'Заявки'."
        ));
    }
}