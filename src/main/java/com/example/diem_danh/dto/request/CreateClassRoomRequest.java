package com.example.diem_danh.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateClassRoomRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String courseId;
    @NotBlank
    private String teacherId;
    @NotBlank
    private String semester;
    @NotBlank
    private String academicYear;
    @Min(1) @Max(200)
    private Integer maxStudents = 60;
    private String schedule;
}