package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long>,
        JpaSpecificationExecutor<RegistrationRequest> {

    List<RegistrationRequest> findByAssemblyIdAndStatus(Long assemblyId, RegistrationStatus status);

    List<RegistrationRequest> findByAssemblyIdOrderByCreatedAtDesc(Long assemblyId);

    boolean existsByPhoneAndStatusIn(String phone, List<RegistrationStatus> statuses);

    boolean existsByEmailAndStatusIn(String email, List<RegistrationStatus> statuses);

    // Проверки дубликатов при импорте из Sheets
    boolean existsByEmail(String email);
    boolean existsByIin(String iin);
}