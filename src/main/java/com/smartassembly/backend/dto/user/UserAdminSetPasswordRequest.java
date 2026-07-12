package com.smartassembly.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Админ устанавливает новый пароль пользователю
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminSetPasswordRequest {

    @NotBlank
    @Size(min = 6, message = "Пароль должен быть не короче 6 символов")
    private String newPassword;
}
