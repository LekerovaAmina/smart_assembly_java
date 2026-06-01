package com.smartassembly.backend.exception;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ErrorResponse {
    private String code;
    private String message;
    private Instant timestamp;
    private String path;
    private List<FieldErrorItem> errors;

    @Data
    @Builder
    public static class FieldErrorItem {
        private String field;
        private String message;
    }
}
