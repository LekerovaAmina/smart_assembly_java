package com.smartassembly.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Отправить SMS код
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SendOtpRequest {
    @NotBlank
    private String phone;
}