package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.StrikeAppeal;
import com.smartassembly.backend.enums.AppealStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StrikeAppealRepository extends JpaRepository<StrikeAppeal, Long> {

    List<StrikeAppeal> findByUserId(Long userId);

    // HR видит все pending заявки своего отделения
    List<StrikeAppeal> findByStatusOrderByCreatedAtAsc(AppealStatus status);

    // Уже есть апелляция на этот страйк?
    boolean existsByStrikeId(Long strikeId);

    Optional<StrikeAppeal> findByStrikeId(Long strikeId);

    @Query("SELECT a FROM StrikeAppeal a JOIN FETCH a.strike s JOIN FETCH s.user u " +
            "WHERE a.status = :status ORDER BY a.createdAt ASC")
    List<StrikeAppeal> findByStatusWithStrikeOrderByCreatedAtAsc(@Param("status") AppealStatus status);

    @Query("SELECT a FROM StrikeAppeal a JOIN FETCH a.strike s JOIN FETCH s.user u " +
            "WHERE a.status = :status AND u.assembly.id = :assemblyId ORDER BY a.createdAt ASC")
    List<StrikeAppeal> findByStatusAndAssemblyIdOrderByCreatedAtAsc(
            @Param("status") AppealStatus status, @Param("assemblyId") Long assemblyId);
}