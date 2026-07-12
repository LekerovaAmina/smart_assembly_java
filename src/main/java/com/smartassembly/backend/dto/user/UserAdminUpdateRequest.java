package com.smartassembly.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Редактирование данных пользователя админом
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminUpdateRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private String middleName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phone;
}

