package com.smartassembly.backend.integration.sheets;

import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.repository.AssemblyRepository;
import com.smartassembly.backend.repository.RegistrationRequestRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final RegistrationRequestRepository requestRepository;
    private final AssemblyRepository assemblyRepository;

    @Value("${google.sheets.default-assembly-id}")
    private Long defaultAssemblyId;

    @Deprecated
    @PostMapping("/sheets")
    public ResponseEntity<?> onSheetsRow(@Valid @RequestBody SheetsWebhookDto dto) {
        Assembly assembly = assemblyRepository.findById(defaultAssemblyId)
                .orElseThrow(() -> new IllegalStateException("Assembly not found for id=" + defaultAssemblyId));

        if (dto.getEmail() != null && requestRepository.existsByEmail(dto.getEmail().trim())) {
            return ResponseEntity.ok().header("X-Deprecated", "true").body("duplicate:email");
        }
        if (dto.getIin() != null && requestRepository.existsByIin(dto.getIin().trim())) {
            return ResponseEntity.ok().header("X-Deprecated", "true").body("duplicate:iin");
        }

        RegistrationRequest request = RegistrationRequestMapper.mapWebhook(dto, assembly);
        requestRepository.save(request);
        log.info("Webhook saved registration request email={}, phone={}", request.getEmail(), request.getPhone());
        return ResponseEntity.ok()
                .header("X-Deprecated", "true")
                .body("ok");
    }
}