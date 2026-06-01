package com.smartassembly.backend.integration.sheets;

import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.CellData;
import com.google.api.services.sheets.v4.model.CellFormat;
import com.google.api.services.sheets.v4.model.ExtendedValue;
import com.google.api.services.sheets.v4.model.GridData;
import com.google.api.services.sheets.v4.model.RowData;
import com.google.api.services.sheets.v4.model.Sheet;
import com.google.api.services.sheets.v4.model.Spreadsheet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleSheetsImportService {

    private final Sheets sheets;

    @Value("${google.sheets.spreadsheet-id}")
    private String spreadsheetId;

    @Value("${google.sheets.range:}")
    private String range;

    private String getRange() {
        return "\u041e\u0442\u0432\u0435\u0442\u044b \u043d\u0430 \u0444\u043e\u0440\u043c\u0443 (1)!A2:Q";
    }

    public List<SheetsRowData> getAllRows() throws IOException {
        Spreadsheet ss = sheets.spreadsheets()
                .get(spreadsheetId)
                .setRanges(Collections.singletonList(getRange()))
                .setIncludeGridData(true)
                .execute();

        if (ss.getSheets() == null || ss.getSheets().isEmpty()) {
            return List.of();
        }

        List<SheetsRowData> out = new ArrayList<>();

        for (Sheet sheet : ss.getSheets()) {
            if (sheet.getData() == null) continue;
            for (GridData grid : sheet.getData()) {
                if (grid.getRowData() == null) continue;
                for (int i = 0; i < grid.getRowData().size(); i++) {
                    RowData row = grid.getRowData().get(i);
                    List<String> values = extractRowValues(row, 17);

                    // === НАЧАЛО ФИЛЬТРАЦИИ ПУСТЫХ СТРОК ===
                    if (values == null || values.isEmpty() ||
                            (values.size() > 1 && (values.get(1) == null || values.get(1).trim().isEmpty()))) {
                        continue;
                    }
                    // === КОНЕЦ ФИЛЬТРАЦИИ ПУСТЫХ СТРОК ===

                    String colorHex = extractRowBackgroundHex(row);
                    out.add(SheetsRowData.builder()
                            .rowIndex(i)
                            .values(values)
                            .rowBackgroundHex(colorHex)
                            .timestamp(cell(values, 0))
                            .fullName(cell(values, 1))
                            .birthDate(cell(values, 2))
                            .phone(cell(values, 3))
                            .iin(cell(values, 4))
                            .email(cell(values, 5))
                            .instagram(cell(values, 6))
                            .studyPlace(cell(values, 7))
                            .workPlace(cell(values, 8))
                            .volunteeringExperience(cell(values, 9))
                            .hobbies(cell(values, 10))
                            .freeDays(cell(values, 11))
                            .languages(cell(values, 12))
                            .photoUrl(cell(values, 13))
                            .interestedEvents(cell(values, 14))
                            .discoverySource(cell(values, 15))
                            .joinReason(cell(values, 16))
                            .build());
                }
            }
        }

        log.info("Sheets import: fetched {} VALID rows from range {}", out.size(), getRange());
        return out;
    }
    private static String cell(List<String> values, int index) {
        if (values == null || index < 0 || index >= values.size()) {
            return null;
        }
        String value = values.get(index);
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static List<String> extractRowValues(RowData row, int maxColumns) {
        List<CellData> cells = row.getValues();
        List<String> res = new ArrayList<>(maxColumns);
        for (int c = 0; c < maxColumns; c++) {
            String v = null;
            if (cells != null && c < cells.size()) {
                v = cellToString(cells.get(c));
            }
            res.add(v);
        }
        return res;
    }

    private static String cellToString(CellData cell) {
        if (cell == null) return null;
        ExtendedValue ev = cell.getEffectiveValue();
        if (ev == null) ev = cell.getUserEnteredValue();
        if (ev == null) return null;

        if (ev.getStringValue() != null) return ev.getStringValue();
        if (ev.getNumberValue() != null) return String.valueOf(ev.getNumberValue());
        if (ev.getBoolValue() != null) return String.valueOf(ev.getBoolValue());
        return null;
    }

    private static String extractRowBackgroundHex(RowData row) {
        if (row == null || row.getValues() == null) return null;
        for (CellData cell : row.getValues()) {
            CellFormat fmt = cell != null ? cell.getEffectiveFormat() : null;
            if (fmt == null) fmt = cell != null ? cell.getUserEnteredFormat() : null;
            if (fmt != null && fmt.getBackgroundColor() != null) {
                return SheetsColorUtil.toHex(fmt.getBackgroundColor());
            }
        }
        return null;
    }
}

