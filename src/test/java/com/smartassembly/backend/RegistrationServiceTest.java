package com.smartassembly.backend.service;

import com.smartassembly.backend.dto.request.RegistrationRequestDto;
import com.smartassembly.backend.entity.Assembly;
import com.smartassembly.backend.entity.RegistrationRequest;
import com.smartassembly.backend.entity.User;
import com.smartassembly.backend.enums.RegistrationStatus;
import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.repository.AssemblyRepository;
import com.smartassembly.backend.repository.RegistrationRequestRepository;
import com.smartassembly.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock RegistrationRequestRepository requestRepository;
    @Mock UserRepository userRepository;
    @Mock AssemblyRepository assemblyRepository;
    @Mock GoogleSheetsService googleSheetsService;
    @Mock SmsService smsService;

    @InjectMocks RegistrationService registrationService;

    private Assembly assembly;

    @BeforeEach
    void setUp() {
        assembly = Assembly.builder()
                .id(1L)
                .assemblyName("Тест Ассамблея")
                .region("Астана")
                .city("Астана")
                .cityCode("AS")
                .build();
    }

    @Test
    void submitRequest_success() {
        RegistrationRequestDto dto = new RegistrationRequestDto();
        dto.setPhone("+77001234567");
        dto.setFirstName("Аміна");
        dto.setLastName("Тест");
        dto.setAssemblyId(1L);

        when(requestRepository.existsByPhoneAndStatusIn(any(), any())).thenReturn(false);
        when(assemblyRepository.findById(1L)).thenReturn(Optional.of(assembly));
        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RegistrationRequest result = registrationService.submitRequest(dto);

        assertThat(result.getPhone()).isEqualTo("+77001234567");
        assertThat(result.getStatus()).isEqualTo(RegistrationStatus.PENDING);
        verify(requestRepository).save(any());
    }

    @Test
    void submitRequest_duplicatePhone_throwsException() {
        RegistrationRequestDto dto = new RegistrationRequestDto();
        dto.setPhone("+77001234567");
        dto.setAssemblyId(1L);

        when(requestRepository.existsByPhoneAndStatusIn(any(), any())).thenReturn(true);

        assertThatThrownBy(() -> registrationService.submitRequest(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("уже существует");
    }

    @Test
    void approveRequest_sendsSms() throws Exception {
        User hrUser = User.builder().id(99L).role(UserRole.HR).assembly(assembly).build();
        RegistrationRequest request = RegistrationRequest.builder()
                .id(1L)
                .status(RegistrationStatus.PENDING)
                .firstName("Аміна")
                .lastName("Тест")
                .phone("+77001234567")
                .assembly(assembly)
                .build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(smsService).send(any(), any());
        doNothing().when(googleSheetsService).appendUser(any());

        registrationService.approveRequest(1L, hrUser);

        verify(smsService).send(eq("+77001234567"), contains("приняты"));
    }

    @Test
    void approveRequest_alreadyApproved_throwsException() {
        User hrUser = User.builder().id(99L).role(UserRole.HR).assembly(assembly).build();
        RegistrationRequest request = RegistrationRequest.builder()
                .id(1L)
                .status(RegistrationStatus.APPROVED)
                .assembly(assembly)
                .build();

        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> registrationService.approveRequest(1L, hrUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("уже обработана");
    }
}
