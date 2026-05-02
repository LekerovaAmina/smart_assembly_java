package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.EventResponse;
import com.smartassembly.backend.enums.ResponseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventResponseRepository extends JpaRepository<EventResponse, Long> {

    Optional<EventResponse> findByEventIdAndUserId(Long eventId, Long userId);

    boolean existsByEventIdAndUserId(Long eventId, Long userId);

    List<EventResponse> findByEventId(Long eventId);

    List<EventResponse> findByUserId(Long userId);

    // Кто не пришёл на мероприятие (для выдачи страйков)
    List<EventResponse> findByEventIdAndStatus(Long eventId, ResponseStatus status);

    // Подсчёт участников по статусу
    long countByEventId(Long eventId);
    long countByEventIdAndStatus(Long eventId, ResponseStatus status);
}