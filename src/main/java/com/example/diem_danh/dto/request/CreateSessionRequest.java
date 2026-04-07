package com.example.diem_danh.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateSessionRequest {
    @NotNull
    private Integer sessionNumber;
    @NotNull
    private LocalDateTime startTime;
    @NotNull
    private LocalDateTime endTime;
    @NotBlank
    private String room;
}