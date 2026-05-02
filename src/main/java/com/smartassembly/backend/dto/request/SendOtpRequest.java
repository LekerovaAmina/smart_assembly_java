package com.smartassembly.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Отправить SMS код
@Data
public class SendOtpRequest {
    @NotBlank
    private String phone;
}