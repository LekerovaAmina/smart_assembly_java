package com.smartassembly.backend.dto.response;

import com.smartassembly.backend.entity.Event;
import com.smartassembly.backend.enums.EventStatus;
import com.smartassembly.backend.enums.EventType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Data
@Builder
public class EventResponseDto {

    private Long id;
    private String eventName;
    private EventType eventType;
    private String description;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String dressCode;
    private String objectives;
    private String tasks;
    private List<String> speakers;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private EventStatus status;
    private String qrCodeData;

    // Координатор (упрощённо)
    private Long coordinatorId;
    private String coordinatorName;

    // Кто создал
    private Long createdById;
    private String createdByName;

    // Для волонтёра — зарегистрирован ли он на это мероприятие
    private Boolean isRegistered;

    public static EventResponseDto from(Event event) {
        return EventResponseDto.builder()
                .id(event.getId())
                .eventName(event.getEventName())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .dressCode(event.getDressCode())
                .objectives(event.getObjectives())
                .tasks(event.getTasks())
                .speakers(event.getSpeakers() != null
                        ? Arrays.asList(event.getSpeakers().split(","))
                        : List.of())
                .maxParticipants(event.getMaxParticipants())
                .currentParticipants(event.getCurrentParticipants())
                .status(event.getStatus())
                .qrCodeData(event.getQrCodeData())
                .coordinatorId(event.getCoordinator() != null ? event.getCoordinator().getId() : null)
                .coordinatorName(event.getCoordinator() != null
                        ? event.getCoordinator().getFirstName() + " " + event.getCoordinator().getLastName()
                        : null)
                .createdById(event.getCreatedBy() != null ? event.getCreatedBy().getId() : null)
                .createdByName(event.getCreatedBy() != null
                        ? event.getCreatedBy().getFirstName() + " " + event.getCreatedBy().getLastName()
                        : null)
                .build();
    }
}