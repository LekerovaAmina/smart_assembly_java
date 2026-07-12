package com.smartassembly.backend.dto.user;

import com.smartassembly.backend.enums.UserRole;
import com.smartassembly.backend.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponseDto {
    private Long id;
    private String uniqueId;
    private String firstName;
    private String lastName;
    private String middleName;
    private String phone;
    private String email;
    private UserRole role;
    private UserStatus status;
    private BigDecimal totalHours;
    private Integer strikeCount;
    private Long departmentId;
    private LocalDateTime createdAt;
}
