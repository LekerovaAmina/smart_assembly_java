package com.smartassembly.backend.dto.user;

import com.smartassembly.backend.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRoleRequest {

    @NotNull
    private UserRole role;
}
