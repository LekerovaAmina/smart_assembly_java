package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying; // Добавь этот импорт
import org.springframework.data.jpa.repository.Query;    // Добавь этот импорт
import org.springframework.data.repository.query.Param; // Добавь этот импорт
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    //eeee
    @Modifying
    @Query("UPDATE Event e SET e.currentParticipants = e.currentParticipants - 1 " +
            "WHERE e.id = :eventId AND e.currentParticipants > 0")
    int decrementParticipants(@Param("eventId") Long eventId);

    List<Event> findByAssemblyIdAndStatusIn(Long assemblyId, List<EventStatus> statuses);

    List<Event> findByAssemblyIdOrderByEventDateDesc(Long assemblyId);

    Page<Event> findByAssemblyId(Long assemblyId, Pageable pageable);

    Page<Event> findByAssemblyIdAndStatusIn(Long assemblyId, List<EventStatus> statuses, Pageable pageable);

    Optional<Event> findByQrCodeData(String qrCodeData);

    List<Event> findByStatusAndEventDateBefore(EventStatus status, LocalDate date);
}