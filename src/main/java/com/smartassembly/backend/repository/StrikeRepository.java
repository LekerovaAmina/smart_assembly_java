package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.Strike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StrikeRepository extends JpaRepository<Strike, Long> {

    List<Strike> findByUserId(Long userId);

    List<Strike> findByUserIdAndIsActiveTrue(Long userId);

    // Проверка — уже есть страйк за это мероприятие?
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
}