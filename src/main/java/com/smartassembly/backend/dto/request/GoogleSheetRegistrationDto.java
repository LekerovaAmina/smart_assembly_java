package com.smartassembly.backend.dto.request;

import lombok.Data;

@Data
public class GoogleSheetRegistrationDto {
    private String timestamp;
    private String fullName;
    private String birthDate;
    private String phone;
    private String iin;
    private String email;
    private String instagram;
    private String studyPlace;
    private String workPlace;
    private String experience;
    private String hobbies;
    private String freeDays;
    private String languages;
    private String photoUrl;
    private String interests;
    private String discoverySource;
    private String joinReason;
}