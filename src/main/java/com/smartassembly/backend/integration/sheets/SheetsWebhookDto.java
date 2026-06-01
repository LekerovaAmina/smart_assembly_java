package com.smartassembly.backend.integration.sheets;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload sent from Google Apps Script on onFormSubmit.
 * All fields are nullable except email/phone; rowColorHex is optional.
 */
@Data
public class SheetsWebhookDto {
    private String timestamp;          // A
    private String fullName;           // B
    private String birthDate;          // C

    @NotBlank
    private String phone;              // D

    private String iin;                // E

    @NotBlank
    @Email
    private String email;              // F

    private String instagram;          // G
    private String studyPlace;         // H
    private String workPlace;          // I
    private String volunteeringExperience; // J
    private String hobbies;            // K
    private String freeDays;           // L
    private String languages;          // M
    private String photoUrl;           // N
    private String interestedEvents;   // O
    private String discoverySource;    // P
    private String joinReason;         // Q

    // Row background color in hex: "#00FF00", "#FF00FF", ...
    private String rowColorHex;
}

