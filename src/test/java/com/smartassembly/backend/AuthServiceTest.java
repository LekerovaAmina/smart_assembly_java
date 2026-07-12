package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.request.LoginRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.exception.EntityNotFoundException;
import com.smartassembly.backend.exception.InvalidCredentialsException;
import com.smartassembly.backend.exception.UserNotApprovedException;
import com.smartassembly.backend.repository.OtpCodeRepository;
import com.smartassembly.backend.repository.UserRepository;
import com.smartassembly.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock OtpCodeRepository otpCodeRepository;
    @Mock JwtUtil jwtUtil;
    @Mock SmsService smsService;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthService authService;

    private User activeUser(String hash) {
        return User.builder()
                .id(1L)
                .email("user@example.com")
                .firstName("Аміна")
                .lastName("Тест")
                .role(UserRole.VOLUNTEER)
                .isActive(true)
                .passwordHash(hash)
                .build();
    }

    @Test
    void login_success() {
        User user = activeUser("hashed");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Passw0rd!", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken("user@example.com")).thenReturn("token123");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = authService.login(new LoginRequest("user@example.com", "Passw0rd!"));

        assertThat(response.getToken()).isEqualTo("token123");
        assertThat(response.getRole()).isEqualTo("VOLUNTEER");
    }

    @Test
    void login_userNotFound_throwsEntityNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("missing@example.com", "pass")))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void login_passwordNotSet_throwsInvalidCredentials() {
        User user = activeUser(null);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "pass")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_wrongPassword_throwsInvalidCredentials() {
        User user = activeUser("hashed");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_notApproved_throwsUserNotApproved() {
        User user = activeUser("hashed");
        user.setIsActive(false);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Passw0rd!", "hashed")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "Passw0rd!")))
                .isInstanceOf(UserNotApprovedException.class);
    }
}
