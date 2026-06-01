package com.smartassembly.backend.dto.importdata;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedImportDto {

    private String timestamp;
    private String fullName;
    private String birthDate;

    @NotBlank
    private String phone;

    private String iin;

    @NotBlank
    @Email
    private String email;

    private String instagram;
    private String studyPlace;
    private String workPlace;
    private String volunteeringExperience;
    private String experience;
    private String hobbies;
    private String freeDays;
    private String languages;
    private String photoUrl;
    private String interestedEvents;
    private String interests;
    private String discoverySource;
    private String joinReason;
    private String rowColorHex;
    private Long assemblyId;
}
