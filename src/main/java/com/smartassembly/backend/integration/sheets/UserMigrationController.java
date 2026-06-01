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

    @PostMapping("/migrate-users")
    public ResponseEntity<Map<String, Object>> migrateUsers() throws IOException {
        UserMigrationService.MigrationResult result = userMigrationService.migrateAllFromSheets();
        return ResponseEntity.ok(Map.of(
                "message", String.format(
                        "Импорт завершён: добавлено %d, дубликатов %d, пропущено %d",
                        result.imported(), result.duplicates(), result.skipped()),
                "imported", result.imported(),
                "duplicates", result.duplicates(),
                "skipped", result.skipped()
        ));
    }
}
