package com.smartassembly.backend.controller;

import com.smartassembly.backend.dto.request.LoginRequest;
import com.smartassembly.backend.dto.request.SendOtpRequest;
import com.smartassembly.backend.dto.request.VerifyOtpRequest;
import com.smartassembly.backend.dto.response.AuthResponse;
import com.smartassembly.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login  { "email": "user@example.com", "password": "..." }
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // POST /api/auth/send-code  { "phone": "+77771234567" }
    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request.getPhone());
        return ResponseEntity.ok(Map.of(
                "message", "Код отправлен на " + request.getPhone()
        ));
    }

    // POST /api/auth/verify-code  { "phone": "+77771234567", "code": "1234" }
    @PostMapping("/verify-code")
    public ResponseEntity<AuthResponse> verifyCode(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }
}