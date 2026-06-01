package com.smartassembly.backend.dto.request;

import com.smartassembly.backend.enums.EventType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {

    @NotBlank(message = "Название мероприятия обязательно")
    private String eventName;

    @NotNull(message = "Тип мероприятия обязателен")
    private EventType eventType;

    private String description;

    @NotNull(message = "Дата обязательна")
    private LocalDate eventDate;

    @NotNull(message = "Время начала обязательно")
    private LocalTime startTime;

    private LocalTime endTime;

    @NotBlank(message = "Место проведения обязательно")
    private String location;

    private String dressCode;
    private String objectives;
    private String tasks;

    // Спикеры передаются как список строк ["Имя1", "Имя2"]
    private List<String> speakers;

    // ID координатора (опционально)
    private Long coordinatorId;

    @NotNull(message = "Максимальное количество участников обязательно")
    @Min(value = 1, message = "Минимум 1 участник")
    private Integer maxParticipants;
}