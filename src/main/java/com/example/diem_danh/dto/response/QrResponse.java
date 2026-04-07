package com.example.diem_danh.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class QrResponse {
    private String qrToken;
    private String qrImageBase64;
    private LocalDateTime expiresAt;
    private Long expiresInSeconds;
    private String sessionId;
}