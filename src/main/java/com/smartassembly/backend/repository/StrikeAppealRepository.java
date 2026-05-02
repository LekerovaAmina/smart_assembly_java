package com.smartassembly.backend.repository;

import com.smartassembly.backend.entity.StrikeAppeal;
import com.smartassembly.backend.enums.AppealStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StrikeAppealRepository extends JpaRepository<StrikeAppeal, Long> {

    List<StrikeAppeal> findByUserId(Long userId);

    // HR видит все pending заявки своего отделения
    List<StrikeAppeal> findByStatusOrderByCreatedAtAsc(AppealStatus status);

    // Уже есть апелляция на этот страйк?
    boolean existsByStrikeId(Long strikeId);
}