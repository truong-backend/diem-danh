package com.example.diem_danh.service;


import com.example.diem_danh.dto.response.QrResponse;

public interface QrService {
    QrResponse generateQr(String sessionId, String requestedByUserId);
    QrResponse getActiveQr(String sessionId);
}