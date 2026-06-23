package com.smartassembly.backend.dto.response;

import com.smartassembly.backend.entity.RegistrationRequest;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RegistrationRequestResponseDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String middleName;
    private String email;
    private String phone;
    private java.time.LocalDate birthDate;
    private String motivation;
    private String status;
    private String assemblyName;

    // Поля для отображения HR-у в детальном окне
    private String iin;
    private String instagram;
    private String studyPlace;
    private String workPlace;
    private String hobbies;
    private String photoUrl;
    private String volunteeringExperience;
    private String freeDays;
    private String languages;
    private String interestedEvents;
    private String discoverySource;

    // Метаданные заявки и HR-аудит
    private LocalDateTime createdAt;
    private String hrComment;
    private LocalDateTime reviewedAt;

    public static RegistrationRequestResponseDto from(RegistrationRequest r) {
        RegistrationRequestResponseDto dto = new RegistrationRequestResponseDto();
        dto.setId(r.getId());
        dto.setFirstName(r.getFirstName());
        dto.setLastName(r.getLastName());
        dto.setMiddleName(r.getMiddleName());
        dto.setEmail(r.getEmail());
        dto.setPhone(r.getPhone());
        dto.setBirthDate(r.getBirthDate());
        dto.setMotivation(r.getMotivation());
        dto.setStatus(r.getStatus().name());
        dto.setAssemblyName(r.getAssembly().getAssemblyName());

        dto.setIin(r.getIin());
        dto.setInstagram(r.getInstagram());
        dto.setStudyPlace(r.getStudyPlace());
        dto.setWorkPlace(r.getWorkPlace());
        dto.setHobbies(r.getHobbies());
        dto.setPhotoUrl(r.getPhotoUrl());
        dto.setVolunteeringExperience(r.getVolunteeringExperience());
        dto.setFreeDays(r.getFreeDays());
        dto.setLanguages(r.getLanguages());
        dto.setInterestedEvents(r.getInterestedEvents());
        dto.setDiscoverySource(r.getDiscoverySource());

        dto.setCreatedAt(r.getCreatedAt());
        dto.setHrComment(r.getHrComment());
        dto.setReviewedAt(r.getReviewedAt());

        return dto;
    }
}