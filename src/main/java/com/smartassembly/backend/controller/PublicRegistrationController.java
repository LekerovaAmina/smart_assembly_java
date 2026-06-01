package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.GoogleSheetRegistrationDto;
import com.smartassembly.backend.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/registration")
@RequiredArgsConstructor
public class PublicRegistrationController {

    private final RegistrationService registrationService;

    // Этот эндпоинт прописываем в Google Apps Script
    @Deprecated
    @PostMapping("/google-sheets")
    public ResponseEntity<Void> registerFromSheet(@RequestBody GoogleSheetRegistrationDto dto) {
        registrationService.importFromGoogleSheet(dto);
        return ResponseEntity.ok().header("X-Deprecated", "true").build();
    }
}