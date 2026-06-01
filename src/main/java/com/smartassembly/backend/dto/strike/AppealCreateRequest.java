package com.smartassembly.backend.dto.strike;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppealCreateRequest {

    @NotBlank
    @Size(min = 20)
    private String reason;
}
