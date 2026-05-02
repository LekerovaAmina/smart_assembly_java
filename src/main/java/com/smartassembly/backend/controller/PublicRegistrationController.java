package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.GoogleSheetRegistrationDto;
import com.smartassembly.backend.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/registration")
@RequiredArgsConstructor
public class PublicRegistrationController {

    private final RegistrationService registrationService;

    // Этот эндпоинт прописываем в Google Apps Script
    @PostMapping("/google-sheets")
    public void registerFromSheet(@RequestBody GoogleSheetRegistrationDto dto) {
        registrationService.importFromGoogleSheet(dto);
    }
}