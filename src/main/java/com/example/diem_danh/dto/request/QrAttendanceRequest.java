package com.example.diem_danh.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QrAttendanceRequest {
    @NotBlank
    private String qrToken;
    // Client gửi thêm thông tin thiết bị (optional)
    private String deviceInfo;
}