package com.smartassembly.backend.dto.user;

import com.smartassembly.backend.enums.UserAccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateStatusRequest {

    @NotNull
    private UserAccountStatus status;
}
