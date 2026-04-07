package com.example.diem_danh.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateCourseRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String code;
    @NotNull @Min(1) @Max(10)
    private Integer credits;
    private String description;
}