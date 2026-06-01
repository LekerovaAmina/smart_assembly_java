package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.request.RegistrationRequestDto;
import com.smartassembly.backend.dto.request.GoogleSheetRegistrationDto;
import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.RegistrationStatus;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
import com.smartassembly.backend.repository.AssemblyRepository;
import com.smartassembly.backend.repository.RegistrationRequestRepository;
import com.smartassembly.backend.repository.UserRepository;
import com.smartassembly.backend.dto.response.RegistrationRequestResponseDto;
import com.smartassembly.backend.exception.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.io.IOException;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrationService {

    private static final java.time.format.DateTimeFormatter DATE_FORMATTER =
            java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private final RegistrationRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final AssemblyRepository assemblyRepository;
    private final GoogleSheetsService googleSheetsService;

    @Transactional
    public void importFromGoogleSheet(GoogleSheetRegistrationDto dto) {

        String[] parts = dto.getFullName().split("\\s+");

        RegistrationRequest request = RegistrationRequest.builder()
                .assembly(assemblyRepository.findAll().get(0)) // Или логика поиска по городу
                .lastName(parts.length > 0 ? parts[0] : "")
                .firstName(parts.length > 1 ? parts[1] : "")
                .middleName(parts.length > 2 ? parts[2] : "")
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .iin(dto.getIin())
                .instagram(dto.getInstagram())
                .birthDate(dto.getBirthDate() != null ? java.time.LocalDate.parse(dto.getBirthDate(), DATE_FORMATTER) : null)
                .studyPlace(dto.getStudyPlace())
                .workPlace(dto.getWorkPlace())
                .hobbies(dto.getHobbies())
                .photoUrl(dto.getPhotoUrl())
                .motivation(dto.getJoinReason())
                .status(RegistrationStatus.PENDING)
                .build();

        requestRepository.save(request);
    }

    // Подать заявку (публичный эндпоинт — без авторизации)
    @Transactional
    public RegistrationRequest submitRequest(RegistrationRequestDto dto) {
        // Проверяем что нет активной заявки с таким телефоном
        boolean exists = requestRepository.existsByPhoneAndStatusIn(
                dto.getPhone(),
                List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED)
        );
        if (exists) {
            throw new RuntimeException("Заявка с таким номером телефона уже существует.");
        }

        Assembly assembly = assemblyRepository.findById(dto.getAssemblyId())
                .orElseThrow(() -> new RuntimeException("Отделение не найдено."));

        RegistrationRequest request = RegistrationRequest.builder()
                .assembly(assembly)
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .middleName(dto.getMiddleName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .birthDate(dto.getBirthDate() != null ? java.time.LocalDate.parse(dto.getBirthDate(), DATE_FORMATTER) : null)
                .motivation(dto.getMotivation())
                .status(RegistrationStatus.PENDING)
                .build();

        return requestRepository.save(request);
    }

    // HR видит все заявки своего отделения
    public List<RegistrationRequest> getPendingRequests(Long assemblyId) {
        return requestRepository.findByAssemblyIdAndStatus(assemblyId, RegistrationStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public Page<RegistrationRequestResponseDto> getPendingRequestsPage(User hrUser, Pageable pageable) {
        Long assemblyId = hrUser.getRole() == UserRole.SUPER_ADMIN ? null : hrUser.getAssembly().getId();
        return requestRepository
                .findAll(buildAssemblySpec(assemblyId, List.of(RegistrationStatus.PENDING)), pageable)
                .map(RegistrationRequestResponseDto::from);
    }

    @Transactional(readOnly = true)
    public RegistrationRequestResponseDto getRequestById(Long id, User hrUser) {
        RegistrationRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена"));
        if (hrUser.getRole() == UserRole.HR
                && !request.getAssembly().getId().equals(hrUser.getAssembly().getId())) {
            throw new RuntimeException("Нет доступа к заявкам другого отделения");
        }
        return RegistrationRequestResponseDto.from(request);
    }

    @Transactional(readOnly = true)
    public Page<RegistrationRequestResponseDto> getAllRequests(
            User hrUser, List<RegistrationStatus> statuses, Pageable pageable) {
        Long assemblyId = hrUser.getRole() == UserRole.SUPER_ADMIN ? null : hrUser.getAssembly().getId();
        Specification<RegistrationRequest> spec = buildAssemblySpec(assemblyId, statuses);
        return requestRepository.findAll(spec, pageable).map(RegistrationRequestResponseDto::from);
    }

    private Specification<RegistrationRequest> buildAssemblySpec(
            Long assemblyId, List<RegistrationStatus> statuses) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (assemblyId != null) {
                predicates.add(cb.equal(root.get("assembly").get("id"), assemblyId));
            }
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // HR одобряет заявку → создаётся пользователь → отправляется SMS
    @Transactional
    public User approveRequest(Long requestId, User hrUser) {
        RegistrationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена."));

        if (request.getStatus() != RegistrationStatus.PENDING) {
            throw new RuntimeException("Заявка уже обработана.");
        }

        // Создаём нового пользователя
        User newUser = User.builder()
                .assembly(request.getAssembly())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .middleName(request.getMiddleName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .birthDate(request.getBirthDate())
                .role(UserRole.VOLUNTEER)
                .status(UserStatus.VOLUNTEER)
                .isActive(true)
                .build();

        newUser = userRepository.save(newUser);

        try {
            googleSheetsService.appendUser(newUser);
        } catch (IOException e) {
            log.error("Ошибка синхронизации с Google Sheets: {}", e.getMessage());
            // Не бросаем дальше — Sheets не должен ломать основную логику
        }

        // Обновляем заявку
        request.setStatus(RegistrationStatus.APPROVED);
        request.setReviewedBy(hrUser);
        request.setReviewedAt(LocalDateTime.now());
        request.setCreatedUser(newUser);
        requestRepository.save(request);

        // TODO: отправить SMS о принятии
        // smsService.send(newUser.getPhone(), "Поздравляем! Вы приняты в Smart Assembly.");
        log.info("Пользователь {} {} принят. SMS будет отправлено на {}",
                newUser.getFirstName(), newUser.getLastName(), newUser.getPhone());

        return newUser;
    }

    // HR отклоняет заявку
    @Transactional
    public void rejectRequest(Long requestId, User hrUser, String comment) {
        RegistrationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена."));

        request.setStatus(RegistrationStatus.REJECTED);
        request.setReviewedBy(hrUser);
        request.setReviewedAt(LocalDateTime.now());
        request.setHrComment(comment);
        requestRepository.save(request);
    }


}