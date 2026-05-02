package com.smartassembly.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegistrationRequestDto {

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

    private String birthDate;

    private String motivation;

    @NotNull
    private Long assemblyId; // К какому отделению хочет вступить
}