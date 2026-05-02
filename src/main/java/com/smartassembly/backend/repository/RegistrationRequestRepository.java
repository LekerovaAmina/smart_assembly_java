package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {

    // HR видит все заявки своего отделения
    List<RegistrationRequest> findByAssemblyIdAndStatus(Long assemblyId, RegistrationStatus status);

    // Все заявки отделения (для HR)
    List<RegistrationRequest> findByAssemblyIdOrderByCreatedAtDesc(Long assemblyId);

    // Проверка — нет ли уже заявки с таким телефоном
    boolean existsByPhoneAndStatusIn(String phone, List<RegistrationStatus> statuses);

    boolean existsByEmailAndStatusIn(String email, List<RegistrationStatus> statuses);
}