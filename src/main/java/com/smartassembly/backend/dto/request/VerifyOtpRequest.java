package com.smartassembly.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Проверить SMS код и войти
@Data
public class VerifyOtpRequest {
    @NotBlank
    private String phone;
    @NotBlank
    private String code;
}