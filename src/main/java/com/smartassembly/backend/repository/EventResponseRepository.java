package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.EventResponse;
import com.smartassembly.backend.enums.EventStatus;
import com.smartassembly.backend.enums.ResponseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Query("SELECT COALESCE(SUM(er.calculatedHours), 0) FROM EventResponse er JOIN er.event e " +
            "WHERE er.user.id = :userId AND e.status = :status")
    BigDecimal sumCalculatedHoursByUserIdAndEventStatus(
            @Param("userId") Long userId, @Param("status") EventStatus status);

    // Часы за период (для рейтинга волонтёра месяца) — по дате самого мероприятия
    @Query("SELECT COALESCE(SUM(er.calculatedHours), 0) FROM EventResponse er JOIN er.event e " +
            "WHERE er.user.id = :userId AND e.status = :status " +
            "AND e.eventDate BETWEEN :from AND :to")
    BigDecimal sumCalculatedHoursByUserIdAndEventStatusAndDateRange(
            @Param("userId") Long userId, @Param("status") EventStatus status,
            @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT er FROM EventResponse er JOIN er.event e " +
            "WHERE er.user.id = :userId AND e.status = :status ORDER BY e.eventDate DESC")
    List<EventResponse> findByUserIdAndEventStatus(
            @Param("userId") Long userId, @Param("status") EventStatus status);
}