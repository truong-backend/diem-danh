package com.example.diem_danh.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class SessionResponse {
    private Long id;
    private String sessionId;
    private Integer sessionNumber;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String room;
    private String status;
    private String classId;
    private String className;
    private boolean hasActiveQr;
    private LocalDateTime qrExpiresAt;
}