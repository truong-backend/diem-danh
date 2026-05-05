package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.response.QrResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.SessionNode;
import com.example.diem_danh.repository.SessionRepository;
import com.example.diem_danh.security.JwtService;
import com.example.diem_danh.service.QrService;
import com.example.diem_danh.service.RedisService;
import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class QrServiceImpl implements QrService {

    private final SessionRepository sessionRepository;
    private final JwtService jwtService;
    private final RedisService redisService;

    @Override
    @Transactional
    public QrResponse generateQr(String sessionId, String requestedByUserId) {
        SessionNode session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy buổi học: " + sessionId));

        // Xóa QR cũ trong Redis trước khi tạo mới — tránh QR cũ vẫn còn hiệu lực song song
        redisService.invalidateQrToken(sessionId);

        String qrToken = jwtService.generateQrToken(sessionId,
                session.getClassRoom() != null ? session.getClassRoom().getClassId() : "");

        long ttlSeconds = jwtService.getQrExpiration() / 1000;
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(ttlSeconds);

        String qrContent   = "ATD:" + qrToken;
        String base64Image = generateQrImage(qrContent);

        session.setQrToken(qrToken);
        session.setQrExpiresAt(expiresAt);
        session.setQrImageBase64(base64Image);
        session.setStatus("ONGOING");
        sessionRepository.save(session);

        // Cache token mới vào Redis
        redisService.saveQrToken(sessionId, qrToken, ttlSeconds);
        log.info("QR generated and cached for session={}, ttl={}s", sessionId, ttlSeconds);

        return QrResponse.builder()
                .qrToken(qrToken)
                .qrImageBase64(base64Image)
                .expiresAt(expiresAt)
                .expiresInSeconds(ttlSeconds)
                .sessionId(sessionId)
                .build();
    }

    @Override
    public QrResponse getActiveQr(String sessionId) {
        Optional<String> cachedToken = redisService.getQrToken(sessionId);

        if (cachedToken.isPresent()) {
            String token = cachedToken.get();
            long secondsLeft = 0;
            try {
                long expMs = jwtService.extractExpiration(token).getTime();
                secondsLeft = (expMs - System.currentTimeMillis()) / 1000;
            } catch (Exception ignored) {}

            if (secondsLeft > 0) {
                SessionNode session = sessionRepository.findBySessionId(sessionId)
                        .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy buổi học"));
                return QrResponse.builder()
                        .qrToken(token)
                        .qrImageBase64(session.getQrImageBase64())
                        .expiresAt(session.getQrExpiresAt())
                        .expiresInSeconds(secondsLeft)
                        .sessionId(sessionId)
                        .build();
            }
        }

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