package com.example.diem_danh.exception;

import org.springframework.http.HttpStatus;

public class QrExpiredException extends AttendanceException {
    public QrExpiredException() {
        super("QR code đã hết hạn hoặc không hợp lệ", HttpStatus.GONE);
    }
}