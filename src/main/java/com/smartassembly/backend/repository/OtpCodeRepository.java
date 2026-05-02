package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    // Найти последний валидный код для телефона
    Optional<OtpCode> findTopByPhoneAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phone, LocalDateTime now
    );

    // Пометить все старые коды телефона как использованные (при отправке нового)
    @Modifying
    @Transactional
    @Query("UPDATE OtpCode o SET o.isUsed = true WHERE o.phone = :phone AND o.isUsed = false")
    void invalidateAllByPhone(String phone);

    // Удалить истёкшие коды (для чистки)
    @Modifying
    @Transactional
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}