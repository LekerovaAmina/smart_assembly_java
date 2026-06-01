package com.smartassembly.backend.integration.sheets;

import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.repository.AssemblyRepository;
import com.smartassembly.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserMigrationService {

    private final GoogleSheetsImportService sheetsImportService;
    private final UserRepository userRepository;
    private final AssemblyRepository assemblyRepository;

    @Value("${google.sheets.default-assembly-id}")
    private Long defaultAssemblyId;

    /**
     * One-time import of all rows in Google Sheets into users table.
     * Dedup by email OR iin. Email/phone are required by DB; rows missing them are skipped.
     */
    @Transactional
    public MigrationResult migrateAllFromSheets() throws IOException {
        Assembly assembly = assemblyRepository.findById(defaultAssemblyId)
                .orElseThrow(() -> new IllegalStateException("Assembly not found for id=" + defaultAssemblyId));

        List<SheetsRowData> rows = sheetsImportService.getAllRows();

        int imported = 0;
        int skipped = 0;
        int duplicates = 0;

        for (SheetsRowData row : rows) {
            User u = UserFromSheetsMapper.mapRow(row, assembly);

            String email = u.getEmail();
            String phone = u.getPhone();
            if (email == null || phone == null) {
                skipped++;
                continue;
            }

            if (userRepository.existsByEmail(email)) {
                duplicates++;
                continue;
            }
            if (u.getIin() != null && userRepository.existsByIin(u.getIin())) {
                duplicates++;
                continue;
            }

            userRepository.save(u);
            imported++;
        }

        log.info("Sheets migration finished. imported={}, duplicates={}, skipped={}", imported, duplicates, skipped);
        return new MigrationResult(imported, duplicates, skipped);
    }

    public record MigrationResult(int imported, int duplicates, int skipped) {}
}

