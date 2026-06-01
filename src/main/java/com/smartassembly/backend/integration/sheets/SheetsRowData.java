package com.smartassembly.backend.integration.sheets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SheetsRowData {

    private int rowIndex;
    private List<String> values;
    private String rowBackgroundHex;

    // Колонки A–Q (как в SheetsWebhookDto)
    private String timestamp;
    private String fullName;
    private String birthDate;
    private String phone;
    private String iin;
    private String email;
    private String instagram;
    private String studyPlace;
    private String workPlace;
    private String volunteeringExperience;
    private String hobbies;
    private String freeDays;
    private String languages;
    private String photoUrl;
    private String interestedEvents;
    private String discoverySource;
    private String joinReason;
}
