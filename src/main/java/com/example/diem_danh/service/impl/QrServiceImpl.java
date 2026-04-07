package com.example.diem_danh.service.impl;


import com.example.diem_danh.dto.response.QrResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.SessionNode;
import com.example.diem_danh.repository.SessionRepository;
import com.example.diem_danh.security.JwtService;
import com.example.diem_danh.service.QrService;
import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class QrServiceImpl implements QrService {

    private final SessionRepository sessionRepository;
    private final JwtService jwtService;

    @Override
    @Transactional
    public QrResponse generateQr(String sessionId, String requestedByUserId) {
        SessionNode session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy buổi học: " + sessionId));

        String qrToken = jwtService.generateQrToken(sessionId,
                session.getClassRoom() != null ? session.getClassRoom().getClassId() : "");

        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(
                jwtService.getQrExpiration() / 1000);

        String qrContent = "ATD:" + qrToken;
        String base64Image = generateQrImage(qrContent);

        session.setQrToken(qrToken);
        session.setQrExpiresAt(expiresAt);
        session.setQrImageBase64(base64Image);
        session.setStatus("ONGOING");
        sessionRepository.save(session);

        return QrResponse.builder()
                .qrToken(qrToken)
                .qrImageBase64(base64Image)
                .expiresAt(expiresAt)
                .expiresInSeconds(jwtService.getQrExpiration() / 1000)
                .sessionId(sessionId)
                .build();
    }

    @Override
    public QrResponse getActiveQr(String sessionId) {
        SessionNode session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy buổi học"));

        if (session.getQrToken() == null || session.getQrExpiresAt() == null
                || session.getQrExpiresAt().isBefore(LocalDateTime.now())) {
            throw AttendanceException.badRequest("Không có QR hợp lệ. Hãy tạo QR mới.");
        }

        long secondsLeft = session.getQrExpiresAt().toEpochSecond(ZoneOffset.UTC)
                - LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);

        return QrResponse.builder()
                .qrToken(session.getQrToken())
                .qrImageBase64(session.getQrImageBase64())
                .expiresAt(session.getQrExpiresAt())
                .expiresInSeconds(secondsLeft)
                .sessionId(sessionId)
                .build();
    }

    private String generateQrImage(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 300, 300);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo QR code: " + e.getMessage());
        }
    }
}