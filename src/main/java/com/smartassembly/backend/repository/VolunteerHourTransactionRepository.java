package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.VolunteerHourTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VolunteerHourTransactionRepository extends JpaRepository<VolunteerHourTransaction, Long>,
        JpaSpecificationExecutor<VolunteerHourTransaction> {

    List<VolunteerHourTransaction> findByVolunteerIdOrderByCreatedAtDesc(Long volunteerId);

    @Query("SELECT COALESCE(SUM(t.hoursDelta), 0) FROM VolunteerHourTransaction t WHERE t.volunteer.id = :volunteerId")
    BigDecimal sumHoursDeltaByVolunteerId(@Param("volunteerId") Long volunteerId);

    // Корректировки за период (для рейтинга волонтёра месяца)
    @Query("SELECT COALESCE(SUM(t.hoursDelta), 0) FROM VolunteerHourTransaction t " +
            "WHERE t.volunteer.id = :volunteerId AND t.createdAt BETWEEN :from AND :to")
    BigDecimal sumHoursDeltaByVolunteerIdAndDateRange(
            @Param("volunteerId") Long volunteerId,
            @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
