package com.smartassembly.backend;

import com.smartassembly.backend.config.GoogleSheetsConfig;

import com.smartassembly.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.smartassembly.backend.service.GoogleSheetsService;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;


@SpringBootTest(classes = AjApplication.class)
@EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class})
class AjApplicationTests {

    @MockBean
    UserRepository userRepository;

    @MockBean
    OtpCodeRepository otpCodeRepository;

    @MockBean
    GoogleSheetsService googleSheetsService;

    @MockBean
    AssemblyRepository assemblyRepository;

    @MockBean
    EventRepository eventRepository;

    @MockBean
    EventResponseRepository eventResponseRepository;

    @MockBean
    RegistrationRequestRepository registrationRequestRepository;

    @Test
    void contextLoads() {
    }
}