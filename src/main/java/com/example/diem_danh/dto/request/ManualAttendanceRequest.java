package com.example.diem_danh.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ManualAttendanceRequest {
    @NotBlank
    private String sessionId;
    @NotNull
    private List<StudentStatus> students;

    @Data
    public static class StudentStatus {
        private String studentId;
        private String status; // PRESENT, ABSENT, LATE, EXCUSED
        private String note;
    }
}