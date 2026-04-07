package com.example.diem_danh.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class AttendanceResponse {
    private Long id;
    private String attendanceId;
    private String status;
    private String method;
    private LocalDateTime checkedInAt;
    private String note;
    private StudentInfo student;
    private SessionInfo session;

    @Data @Builder
    public static class StudentInfo {
        private String userId;
        private String studentId;
        private String fullName;
        private String email;
    }

    @Data @Builder
    public static class SessionInfo {
        private String sessionId;
        private Integer sessionNumber;
        private LocalDateTime startTime;
        private String className;
    }
}