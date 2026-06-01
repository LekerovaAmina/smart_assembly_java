package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.strike.AppealCreateRequest;
import com.smartassembly.backend.dto.strike.AppealResponseDto;
import com.smartassembly.backend.dto.strike.StrikeCreateRequest;
import com.smartassembly.backend.dto.strike.StrikeResponseDto;
import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.entity.Strike;
import com.smartassembly.backend.entity.StrikeAppeal;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.AppealStatus;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.repository.EventRepository;
import com.smartassembly.backend.repository.StrikeAppealRepository;
import com.smartassembly.backend.repository.StrikeRepository;
import com.smartassembly.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StrikeService {

    private final StrikeRepository strikeRepository;
    private final StrikeAppealRepository appealRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    @Transactional
    public StrikeResponseDto createStrike(Long volunteerId, StrikeCreateRequest request, User issuer) {
        requireHrOrAdmin(issuer);

        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new RuntimeException("Волонтёр не найден"));

        if (issuer.getRole() == UserRole.HR
                && !volunteer.getAssembly().getId().equals(issuer.getAssembly().getId())) {
            throw new RuntimeException("Нет доступа к волонтёрам другого отделения");
        }

        Event event = null;
        if (request.getEventId() != null) {
            event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new RuntimeException("Мероприятие не найдено"));
            if (strikeRepository.existsByUserIdAndEventId(volunteerId, request.getEventId())) {
                throw new RuntimeException("Страйк за это мероприятие уже выдан");
            }
        }

        Strike strike = Strike.builder()
                .user(volunteer)
                .event(event)
                .reason(request.getReason().trim())
                .severity(request.getSeverity())
                .isActive(true)
                .isAppealed(false)
                .issuedBy(issuer)
                .build();

        strike = strikeRepository.save(strike);
        incrementStrikeCounters(volunteer, true);

        log.info("Strike {} issued to user {} by {}", strike.getId(), volunteerId, issuer.getId());
        return toStrikeDto(strike);
    }

    @Transactional(readOnly = true)
    public List<StrikeResponseDto> getMyStrikes(User currentUser) {
        return strikeRepository.findByUserIdOrderByIssuedAtDesc(currentUser.getId()).stream()
                .map(this::toStrikeDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StrikeResponseDto> getStrikesForVolunteer(Long volunteerId, User currentUser) {
        requireHrOrAdmin(currentUser);

        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new RuntimeException("Волонтёр не найден"));

        if (currentUser.getRole() == UserRole.HR
                && !volunteer.getAssembly().getId().equals(currentUser.getAssembly().getId())) {
            throw new RuntimeException("Нет доступа к волонтёрам другого отделения");
        }

        return strikeRepository.findByUserIdOrderByIssuedAtDesc(volunteerId).stream()
                .map(this::toStrikeDto)
                .toList();
    }

    @Transactional
    public StrikeResponseDto revokeStrike(Long strikeId, User revoker) {
        requireHrOrAdmin(revoker);

        Strike strike = strikeRepository.findById(strikeId)
                .orElseThrow(() -> new RuntimeException("Страйк не найден"));

        if (revoker.getRole() == UserRole.HR
                && !strike.getUser().getAssembly().getId().equals(revoker.getAssembly().getId())) {
            throw new RuntimeException("Нет доступа к страйкам другого отделения");
        }

        if (!Boolean.TRUE.equals(strike.getIsActive())) {
            throw new RuntimeException("Страйк уже неактивен");
        }

        strike.setIsActive(false);
        strike.setRemovedAt(LocalDateTime.now());
        strike.setRemovedBy(revoker);
        strikeRepository.save(strike);
        decrementActiveStrikes(strike.getUser());

        return toStrikeDto(strike);
    }

    @Transactional
    public AppealResponseDto createAppeal(Long strikeId, AppealCreateRequest request, User volunteer) {
        Strike strike = strikeRepository.findById(strikeId)
                .orElseThrow(() -> new RuntimeException("Страйк не найден"));

        if (!strike.getUser().getId().equals(volunteer.getId())) {
            throw new RuntimeException("Можно подать апелляцию только на свой страйк");
        }

        if (!Boolean.TRUE.equals(strike.getIsActive())) {
            throw new RuntimeException("Апелляция возможна только на активный страйк");
        }

        if (Boolean.TRUE.equals(strike.getIsAppealed())) {
            throw new RuntimeException("Страйк уже аннулирован по апелляции");
        }

        if (appealRepository.existsByStrikeId(strikeId)) {
            throw new RuntimeException("Апелляция на этот страйк уже подана");
        }

        StrikeAppeal appeal = StrikeAppeal.builder()
                .strike(strike)
                .user(volunteer)
                .reason(request.getReason().trim())
                .status(AppealStatus.PENDING)
                .build();

        appeal = appealRepository.save(appeal);
        log.info("Appeal {} created for strike {}", appeal.getId(), strikeId);
        return toAppealDto(appeal);
    }

    @Transactional(readOnly = true)
    public List<AppealResponseDto> getPendingAppeals(User hrUser) {
        requireHrOrAdmin(hrUser);

        List<StrikeAppeal> appeals;
        if (hrUser.getRole() == UserRole.SUPER_ADMIN) {
            appeals = appealRepository.findByStatusWithStrikeOrderByCreatedAtAsc(AppealStatus.PENDING);
        } else {
            appeals = appealRepository.findByStatusAndAssemblyIdOrderByCreatedAtAsc(
                    AppealStatus.PENDING, hrUser.getAssembly().getId());
        }

        return appeals.stream().map(this::toAppealDto).toList();
    }

    @Transactional
    public AppealResponseDto approveAppeal(Long appealId, User reviewer) {
        requireHrOrAdmin(reviewer);
        StrikeAppeal appeal = getAppealForReview(appealId, reviewer);

        if (appeal.getStatus() != AppealStatus.PENDING) {
            throw new RuntimeException("Апелляция уже рассмотрена");
        }

        Strike strike = appeal.getStrike();
        appeal.setStatus(AppealStatus.APPROVED);
        appeal.setReviewedBy(reviewer);
        appeal.setReviewedAt(LocalDateTime.now());
        appealRepository.save(appeal);

        if (Boolean.TRUE.equals(strike.getIsActive())) {
            strike.setIsActive(false);
            decrementActiveStrikes(strike.getUser());
        }
        strike.setIsAppealed(true);
        strike.setRemovedAt(LocalDateTime.now());
        strike.setRemovedBy(reviewer);
        strikeRepository.save(strike);

        log.info("Appeal {} approved, strike {} annulled", appealId, strike.getId());
        return toAppealDto(appeal);
    }

    @Transactional
    public AppealResponseDto rejectAppeal(Long appealId, String comment, User reviewer) {
        requireHrOrAdmin(reviewer);
        StrikeAppeal appeal = getAppealForReview(appealId, reviewer);

        if (appeal.getStatus() != AppealStatus.PENDING) {
            throw new RuntimeException("Апелляция уже рассмотрена");
        }

        appeal.setStatus(AppealStatus.REJECTED);
        appeal.setHrComment(comment.trim());
        appeal.setReviewedBy(reviewer);
        appeal.setReviewedAt(LocalDateTime.now());
        appealRepository.save(appeal);

        log.info("Appeal {} rejected", appealId);
        return toAppealDto(appeal);
    }

    private StrikeAppeal getAppealForReview(Long appealId, User reviewer) {
        StrikeAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new RuntimeException("Апелляция не найдена"));

        User volunteer = appeal.getStrike().getUser();
        if (reviewer.getRole() == UserRole.HR
                && !volunteer.getAssembly().getId().equals(reviewer.getAssembly().getId())) {
            throw new RuntimeException("Нет доступа к апелляциям другого отделения");
        }
        return appeal;
    }

    private void incrementStrikeCounters(User volunteer, boolean activeOnly) {
        int total = volunteer.getTotalStrikes() != null ? volunteer.getTotalStrikes() : 0;
        volunteer.setTotalStrikes(total + 1);
        if (activeOnly) {
            int active = volunteer.getActiveStrikes() != null ? volunteer.getActiveStrikes() : 0;
            volunteer.setActiveStrikes(active + 1);
        }
        userRepository.save(volunteer);
    }

    private void decrementActiveStrikes(User volunteer) {
        int active = volunteer.getActiveStrikes() != null ? volunteer.getActiveStrikes() : 0;
        volunteer.setActiveStrikes(Math.max(0, active - 1));
        userRepository.save(volunteer);
    }

    private void requireHrOrAdmin(User user) {
        if (user.getRole() != UserRole.HR && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Недостаточно прав");
        }
    }

    private StrikeResponseDto toStrikeDto(Strike strike) {
        User volunteer = strike.getUser();
        AppealStatus appealStatus = strike.getAppeal() != null
                ? strike.getAppeal().getStatus()
                : appealRepository.findByStrikeId(strike.getId())
                        .map(StrikeAppeal::getStatus)
                        .orElse(null);

        return StrikeResponseDto.builder()
                .id(strike.getId())
                .volunteerId(volunteer.getId())
                .volunteerName(formatName(volunteer))
                .reason(strike.getReason())
                .severity(strike.getSeverity())
                .eventId(strike.getEvent() != null ? strike.getEvent().getId() : null)
                .eventName(strike.getEvent() != null ? strike.getEvent().getEventName() : null)
                .isActive(strike.getIsActive())
                .isAppealed(strike.getIsAppealed())
                .issuedAt(strike.getIssuedAt())
                .issuedById(strike.getIssuedBy() != null ? strike.getIssuedBy().getId() : null)
                .issuedByName(strike.getIssuedBy() != null ? formatName(strike.getIssuedBy()) : null)
                .removedAt(strike.getRemovedAt())
                .appealStatus(appealStatus)
                .build();
    }

    private AppealResponseDto toAppealDto(StrikeAppeal appeal) {
        User volunteer = appeal.getUser();
        return AppealResponseDto.builder()
                .id(appeal.getId())
                .strikeId(appeal.getStrike().getId())
                .volunteerId(volunteer.getId())
                .volunteerName(formatName(volunteer))
                .reason(appeal.getReason())
                .status(appeal.getStatus())
                .hrComment(appeal.getHrComment())
                .reviewedAt(appeal.getReviewedAt())
                .reviewedById(appeal.getReviewedBy() != null ? appeal.getReviewedBy().getId() : null)
                .reviewedByName(appeal.getReviewedBy() != null ? formatName(appeal.getReviewedBy()) : null)
                .createdAt(appeal.getCreatedAt())
                .build();
    }

    private String formatName(User user) {
        return user.getLastName() + " " + user.getFirstName();
    }
}
