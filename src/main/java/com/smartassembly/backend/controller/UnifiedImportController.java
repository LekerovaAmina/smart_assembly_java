package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.importdata.UnifiedImportDto;
import com.smartassembly.backend.service.UnifiedImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class UnifiedImportController {

    private final UnifiedImportService unifiedImportService;

    @PostMapping("/sheets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> importSheets(@Valid @RequestBody UnifiedImportDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(unifiedImportService.importFromSheets(dto));
    }
}
