package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.request.VerifyOtpRequest;
import com.smartassembly.backend.dto.response.AuthResponse;
import com.smartassembly.backend.entity.OtpCode;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.repository.OtpCodeRepository;
import com.smartassembly.backend.repository.UserRepository;
import com.smartassembly.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final JwtUtil jwtUtil;
    private final SmsService smsService;

    @Transactional
    public void sendOtp(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден. Сначала подайте заявку на вступление."));

        if (!user.getIsActive()) {
            throw new RuntimeException("Ваша заявка ещё не одобрена HR.");
        }

        otpCodeRepository.invalidateAllByPhone(phone);

        String code = generateCode();

        OtpCode otpCode = OtpCode.builder()
                .phone(phone)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        otpCodeRepository.save(otpCode);

        // Отправляем реальную SMS
        smsService.send(phone, "Ваш код для входа в Smart Assembly: " + code + ". Действует 5 минут.");

        log.info("OTP отправлен на {}", phone);
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        OtpCode otpCode = otpCodeRepository
                .findTopByPhoneAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        request.getPhone(), LocalDateTime.now()
                )
                .orElseThrow(() -> new RuntimeException("Код не найден или истёк. Запросите новый."));

        if (!otpCode.getCode().equals(request.getCode())) {
            throw new RuntimeException("Неверный код.");
        }

        otpCode.setIsUsed(true);
        otpCodeRepository.save(otpCode);

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден."));

        user.setLastActivity(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getPhone());

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .uniqueId(user.getUniqueId())
                .userId(user.getId())
                .build();
    }

    private String generateCode() {
        return String.format("%04d", new Random().nextInt(10000));
    }
}