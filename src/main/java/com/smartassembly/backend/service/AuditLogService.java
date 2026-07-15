package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.audit.AuditLogResponseDto;
import com.smartassembly.backend.entity.AuditLog;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.AuditAction;
import com.smartassembly.backend.repository.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(User actor, AuditAction action, User target, String details) {
        AuditLog entry = AuditLog.builder()
                .actor(actor)
                .actorName(actor.getLastName() + " " + actor.getFirstName())
                .actorRole(actor.getRole().name())
                .action(action)
                .targetUser(target)
                .targetName(target != null ? target.getLastName() + " " + target.getFirstName() : null)
                .details(details)
                .build();
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponseDto> listLogs(AuditAction action, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auditLogRepository.findAll(spec, pageable).map(this::toDto);
    }

    private AuditLogResponseDto toDto(AuditLog log) {
        return AuditLogResponseDto.builder()
                .id(log.getId())
                .actorName(log.getActorName())
                .actorRole(log.getActorRole())
                .action(log.getAction())
                .targetName(log.getTargetName())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
