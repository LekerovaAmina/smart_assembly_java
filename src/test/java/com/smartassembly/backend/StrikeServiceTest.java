package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.strike.StrikeCreateRequest;
import com.smartassembly.backend.dto.strike.StrikeResponseDto;
import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.Strike;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.StrikeSeverity;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.repository.EventRepository;
import com.smartassembly.backend.repository.StrikeAppealRepository;
import com.smartassembly.backend.repository.StrikeRepository;
import com.smartassembly.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StrikeServiceTest {

    @Mock StrikeRepository strikeRepository;
    @Mock StrikeAppealRepository appealRepository;
    @Mock UserRepository userRepository;
    @Mock EventRepository eventRepository;

    @InjectMocks StrikeService strikeService;

    private Assembly assembly;
    private User volunteer;
    private User hrUser;

    @BeforeEach
    void setUp() {
        assembly = Assembly.builder().id(1L).cityCode("AS").build();
        volunteer = User.builder().id(1L).firstName("Волонтёр").lastName("Тест")
                .role(UserRole.VOLUNTEER).assembly(assembly)
                .totalStrikes(0).activeStrikes(0).build();
        hrUser = User.builder().id(2L).firstName("HR").lastName("Тест")
                .role(UserRole.HR).assembly(assembly).build();
    }

    @Test
    void createStrike_success() {
        StrikeCreateRequest request = new StrikeCreateRequest();
        request.setReason("Опоздание");
        request.setSeverity(StrikeSeverity.WARNING);

        when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
        when(strikeRepository.save(any())).thenAnswer(inv -> {
            Strike s = inv.getArgument(0);
            s = Strike.builder()
                    .id(10L).user(volunteer).reason(s.getReason())
                    .severity(s.getSeverity()).isActive(true).isAppealed(false)
                    .issuedBy(hrUser).build();
            return s;
        });
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        StrikeResponseDto result = strikeService.createStrike(1L, request, hrUser);

        assertThat(result.getReason()).isEqualTo("Опоздание");
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    void createStrike_volunteerFromAnotherAssembly_throwsException() {
        Assembly otherAssembly = Assembly.builder().id(2L).build();
        User otherVolunteer = User.builder().id(3L).role(UserRole.VOLUNTEER).assembly(otherAssembly).build();

        StrikeCreateRequest request = new StrikeCreateRequest();
        request.setReason("Тест");
        request.setSeverity(StrikeSeverity.WARNING);

        when(userRepository.findById(3L)).thenReturn(Optional.of(otherVolunteer));

        assertThatThrownBy(() -> strikeService.createStrike(3L, request, hrUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("другого отделения");
    }

    @Test
    void createStrike_byVolunteer_throwsException() {
        StrikeCreateRequest request = new StrikeCreateRequest();
        request.setReason("Тест");

        assertThatThrownBy(() -> strikeService.createStrike(1L, request, volunteer))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("прав");
    }
}
