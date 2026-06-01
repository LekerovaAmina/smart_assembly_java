package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.importdata.UnifiedImportDto;
import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.exception.DuplicateEntityException;
import com.smartassembly.backend.integration.sheets.RegistrationRequestMapper;
import com.smartassembly.backend.integration.sheets.SheetsWebhookDto;
import com.smartassembly.backend.repository.AssemblyRepository;
import com.smartassembly.backend.repository.RegistrationRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedImportService {

    private final RegistrationRequestRepository requestRepository;
    private final AssemblyRepository assemblyRepository;

    @Value("${google.sheets.default-assembly-id}")
    private Long defaultAssemblyId;

    @Transactional
    public Map<String, Object> importFromSheets(UnifiedImportDto dto) {
        Assembly assembly = resolveAssembly(dto);

        if (dto.getEmail() != null && requestRepository.existsByEmail(dto.getEmail().trim())) {
            throw new DuplicateEntityException("duplicate:email");
        }
        if (dto.getIin() != null && requestRepository.existsByIin(dto.getIin().trim())) {
            throw new DuplicateEntityException("duplicate:iin");
        }

        RegistrationRequest request = RegistrationRequestMapper.mapWebhook(toWebhookDto(dto), assembly);
        requestRepository.save(request);

        log.info("Unified import saved registration email={}", request.getEmail());
        return Map.of(
                "message", "Запись импортирована",
                "requestId", request.getId()
        );
    }

    private Assembly resolveAssembly(UnifiedImportDto dto) {
        Long assemblyId = dto.getAssemblyId() != null ? dto.getAssemblyId() : defaultAssemblyId;
        return assemblyRepository.findById(assemblyId)
                .orElseThrow(() -> new IllegalStateException("Assembly not found for id=" + assemblyId));
    }

    private SheetsWebhookDto toWebhookDto(UnifiedImportDto dto) {
        SheetsWebhookDto w = new SheetsWebhookDto();
        w.setTimestamp(dto.getTimestamp());
        w.setFullName(dto.getFullName());
        w.setBirthDate(dto.getBirthDate());
        w.setPhone(dto.getPhone());
        w.setIin(dto.getIin());
        w.setEmail(dto.getEmail());
        w.setInstagram(dto.getInstagram());
        w.setStudyPlace(dto.getStudyPlace());
        w.setWorkPlace(dto.getWorkPlace());
        w.setVolunteeringExperience(
                dto.getVolunteeringExperience() != null ? dto.getVolunteeringExperience() : dto.getExperience());
        w.setHobbies(dto.getHobbies());
        w.setFreeDays(dto.getFreeDays());
        w.setLanguages(dto.getLanguages());
        w.setPhotoUrl(dto.getPhotoUrl());
        w.setInterestedEvents(
                dto.getInterestedEvents() != null ? dto.getInterestedEvents() : dto.getInterests());
        w.setDiscoverySource(dto.getDiscoverySource());
        w.setJoinReason(dto.getJoinReason());
        w.setRowColorHex(dto.getRowColorHex());
        return w;
    }
}
