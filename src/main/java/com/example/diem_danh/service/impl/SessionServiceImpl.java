package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.request.CreateSessionRequest;
import com.example.diem_danh.dto.response.SessionResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.AttendanceNode;
import com.example.diem_danh.model.node.ClassRoomNode;
import com.example.diem_danh.model.node.SessionNode;
import com.example.diem_danh.repository.AttendanceRepository;
import com.example.diem_danh.repository.ClassRoomRepository;
import com.example.diem_danh.repository.SessionRepository;
import com.example.diem_danh.service.NotificationService;
import com.example.diem_danh.service.RedisService;
import com.example.diem_danh.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final ClassRoomRepository classRoomRepository;
    private final AttendanceRepository attendanceRepository;
    private final NotificationService notificationService;
    private final RedisTemplate<String, Object> redisTemplate;  // NEW

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Key Redis dùng cho idempotency lock khi tạo buổi học.
     * Format: session:create:{classId}:{sessionNumber}
     * TTL: 10 giây — đủ để chặn double-click, không block lần tạo hợp lệ sau này.
     */
    private String createLockKey(String classId, int sessionNumber) {
        return "session:create:" + classId + ":" + sessionNumber;
    }

    @Override
    @Transactional
    public SessionResponse createSession(String classId, CreateSessionRequest req) {
        ClassRoomNode cr = classRoomRepository.findByClassId(classId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy lớp: " + classId));

        // ── Lớp bảo vệ 1: Redis idempotency lock (chặn double-click / spam) ──
        String lockKey = createLockKey(classId, req.getSessionNumber());
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", Duration.ofSeconds(10));

        if (!Boolean.TRUE.equals(acquired)) {
            log.warn("Duplicate create-session blocked by Redis lock: class={}, session#={}",
                    classId, req.getSessionNumber());
            throw AttendanceException.conflict(
                    "Đang xử lý yêu cầu tạo buổi học này. Vui lòng không bấm lại.");
        }

        try {
            // ── Lớp bảo vệ 2: Kiểm tra DB — cùng lớp, cùng số buổi ──────────
            if (sessionRepository.existsByClassIdAndSessionNumber(classId, req.getSessionNumber())) {
                throw AttendanceException.conflict(
                        "Buổi học số " + req.getSessionNumber() + " đã tồn tại trong lớp này.");
            }

            // ── Tạo buổi học ──────────────────────────────────────────────────
            SessionNode session = SessionNode.builder()
                    .sessionId("SES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .sessionNumber(req.getSessionNumber())
                    .startTime(req.getStartTime())
                    .endTime(req.getEndTime())
                    .room(req.getRoom())
                    .status("SCHEDULED")
                    .classRoom(cr)
                    .build();

            SessionNode saved = sessionRepository.save(session);
            log.info("Session created: {} for class={}", saved.getSessionId(), classId);

            // Gửi thông báo cho sinh viên (async, không block)
            try {
                String title = "Buổi học mới - " + cr.getName();
                String msg = String.format("Buổi %d: %s tại phòng %s",
                        req.getSessionNumber(), req.getStartTime().format(FMT), req.getRoom());
                List<String> studentIds = getStudentIdsFromClass(cr);
                if (!studentIds.isEmpty()) {
                    notificationService.sendToMany(studentIds, "SESSION_CREATED", title, msg,
                            saved.getSessionId());
                }
            } catch (Exception e) {
                log.warn("Failed to send session-created notifications: {}", e.getMessage());
            }

            return toResponse(saved);

        } catch (AttendanceException e) {
            // Giải phóng lock ngay nếu lỗi để không block request hợp lệ
            redisTemplate.delete(lockKey);
            throw e;
        }
        // Nếu thành công: giữ lock 10s để chặn request trùng gửi liền sau đó
    }

    @Override
    public SessionResponse getSession(String sessionId) {
        return toResponse(findSession(sessionId));
    }

    @Override
    @Transactional
    public SessionResponse updateSession(String sessionId, CreateSessionRequest req) {
        SessionNode session = findSession(sessionId);
        session.setStartTime(req.getStartTime());
        session.setEndTime(req.getEndTime());
        session.setRoom(req.getRoom());
        SessionNode saved = sessionRepository.save(session);

        try {
            if (saved.getClassRoom() != null) {
                ClassRoomNode cr = saved.getClassRoom();
                String title = "Lịch học thay đổi - " + cr.getName();
                String msg = String.format("Buổi %d đổi sang: %s tại phòng %s",
                        saved.getSessionNumber(), saved.getStartTime().format(FMT), saved.getRoom());
                List<String> studentIds = getStudentIdsFromClass(cr);
                if (!studentIds.isEmpty()) {
                    notificationService.sendToMany(studentIds, "SESSION_UPDATED", title, msg, sessionId);
                }
            }
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    @Override
    public List<SessionResponse> getSessionsByClass(String classId) {
        return sessionRepository.findByClassId(classId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSession(String sessionId) {
        SessionNode session = findSession(sessionId);

        try {
            if (session.getClassRoom() != null) {
                ClassRoomNode cr = session.getClassRoom();
                String title = "Buổi học bị hủy - " + cr.getName();
                String msg = String.format("Buổi %d (%s) đã bị hủy",
                        session.getSessionNumber(), session.getStartTime().format(FMT));
                List<String> studentIds = getStudentIdsFromClass(cr);
                if (!studentIds.isEmpty()) {
                    notificationService.sendToMany(studentIds, "SESSION_DELETED", title, msg, sessionId);
                }
            }
        } catch (Exception ignored) {}

        List<AttendanceNode> attendances = attendanceRepository.findBySessionId(sessionId);
        if (!attendances.isEmpty()) {
            attendanceRepository.deleteAll(attendances);
        }
        sessionRepository.delete(session);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<String> getStudentIdsFromClass(ClassRoomNode cr) {
        if (cr.getStudents() == null) return Collections.emptyList();
        return cr.getStudents().stream()
                .filter(u -> u != null && u.getUserId() != null)
                .map(u -> u.getUserId())
                .collect(Collectors.toList());
    }

    private SessionNode findSession(String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy buổi học: " + sessionId));
    }

    public SessionResponse toResponse(SessionNode s) {
        boolean hasActiveQr = s.getQrToken() != null
                && s.getQrExpiresAt() != null
                && s.getQrExpiresAt().isAfter(LocalDateTime.now());

        return SessionResponse.builder()
                .id(s.getId())
                .sessionId(s.getSessionId())
                .sessionNumber(s.getSessionNumber())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .room(s.getRoom())
                .status(s.getStatus())
                .classId(s.getClassRoom() != null ? s.getClassRoom().getClassId() : null)
                .className(s.getClassRoom() != null ? s.getClassRoom().getName() : null)
                .hasActiveQr(hasActiveQr)
                .qrExpiresAt(s.getQrExpiresAt())
                .build();
    }
}
