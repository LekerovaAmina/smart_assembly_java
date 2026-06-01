package com.smartassembly.backend.dto.strike;

import com.smartassembly.backend.enums.StrikeSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StrikeCreateRequest {

    @NotBlank
    private String reason;

    @NotNull
    private StrikeSeverity severity;

    private Long eventId;
}
