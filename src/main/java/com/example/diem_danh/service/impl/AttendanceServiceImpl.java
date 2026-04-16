package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.event.AttendanceEvent;
import com.example.diem_danh.dto.request.ManualAttendanceRequest;
import com.example.diem_danh.dto.request.QrAttendanceRequest;
import com.example.diem_danh.dto.response.AttendanceResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.exception.QrExpiredException;
import com.example.diem_danh.model.node.AttendanceNode;
import com.example.diem_danh.model.node.SessionNode;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.AttendanceRepository;
import com.example.diem_danh.repository.SessionRepository;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.security.JwtService;
import com.example.diem_danh.service.AttendanceService;
import com.example.diem_danh.service.MessagePublisherService;
import com.example.diem_danh.service.RedisService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RedisService redisService;
    private final MessagePublisherService publisherService;

    @Override
    @Transactional
    public AttendanceResponse checkInByQr(QrAttendanceRequest req, String studentUserId) {

        if (!jwtService.isQrTokenValid(req.getQrToken())) {
            throw new QrExpiredException();
        }

        String sessionId = jwtService.extractSubject(req.getQrToken());

        // Validate QR token từ Redis cache (nhanh hơn query Neo4j)
        Optional<String> cachedQr = redisService.getQrToken(sessionId);
        if (cachedQr.isEmpty() || !cachedQr.get().equals(req.getQrToken())) {
            // fallback DB nếu Redis miss
            SessionNode s = sessionRepository.findBySessionId(sessionId)
                    .orElseThrow(() -> AttendanceException.notFound("Buổi học không tồn tại"));
            if (s.getQrToken() == null || !s.getQrToken().equals(req.getQrToken())) {
                throw new QrExpiredException();
            }
        }

        // Distributed lock: chống race-condition điểm danh trùng
        if (!redisService.tryAttendanceLock(studentUserId, sessionId)) {
            throw AttendanceException.conflict("Sinh viên đã điểm danh buổi này rồi");
        }

        try {
            SessionNode session = sessionRepository.findBySessionId(sessionId)
                    .orElseThrow(() -> AttendanceException.notFound("Buổi học không tồn tại"));

            UserNode student = userRepository.findByUserId(studentUserId)
                    .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy sinh viên"));

            attendanceRepository.findBySessionAndStudent(sessionId, studentUserId)
                    .ifPresent(a -> { throw AttendanceException.conflict("Sinh viên đã điểm danh buổi này rồi"); });

            LocalDateTime now = LocalDateTime.now();
            String status = now.isAfter(session.getStartTime().plusMinutes(15)) ? "LATE" : "PRESENT";
            String ipAddress = extractClientIp();
            String deviceInfo = req.getDeviceInfo() != null ? req.getDeviceInfo() : extractUserAgent();

            AttendanceNode attendance = AttendanceNode.builder()
                    .attendanceId("ATD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .status(status)
                    .method("QR_CODE")
                    .checkedInAt(now)
                    .ipAddress(ipAddress)
                    .deviceInfo(deviceInfo)
                    .student(student)
                    .session(session)
                    .build();

            AttendanceNode saved = attendanceRepository.save(attendance);

            AttendanceEvent.EventType eventType =
                    "LATE".equals(status) ? AttendanceEvent.EventType.LATE_ALERT
                                          : AttendanceEvent.EventType.CHECK_IN;

            publisherService.publishAttendanceEvent(AttendanceEvent.builder()
                    .attendanceId(saved.getAttendanceId())
                    .sessionId(sessionId)
                    .studentId(studentUserId)
                    .studentName(student.getFullName())
                    .status(status)
                    .method("QR_CODE")
                    .classId(session.getClassRoom() != null ? session.getClassRoom().getClassId() : "")
                    .className(session.getClassRoom() != null ? session.getClassRoom().getName() : "")
                    .checkedInAt(now)
                    .ipAddress(ipAddress)
                    .eventType(eventType)
                    .build());

            log.info("QR check-in: student={}, session={}, status={}", studentUserId, sessionId, status);
            return toResponse(saved);

        } catch (AttendanceException e) {
            redisService.releaseAttendanceLock(studentUserId, sessionId);
            throw e;
        }
    }

    @Override
    @Transactional
    public List<AttendanceResponse> checkInManual(ManualAttendanceRequest req) {
        SessionNode session = sessionRepository.findBySessionId(req.getSessionId())
                .orElseThrow(() -> AttendanceException.notFound("Buổi học không tồn tại"));

        List<AttendanceResponse> results = new ArrayList<>();

        for (ManualAttendanceRequest.StudentStatus ss : req.getStudents()) {
            UserNode student = userRepository.findByUserId(ss.getStudentId())
                    .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy sv: " + ss.getStudentId()));

            Optional<AttendanceNode> existing = attendanceRepository
                    .findBySessionAndStudent(req.getSessionId(), ss.getStudentId());

            AttendanceNode attendance;
            if (existing.isPresent()) {
                attendance = existing.get();
                attendance.setStatus(ss.getStatus());
                attendance.setMethod("MANUAL");
                attendance.setNote(ss.getNote());
            } else {
                attendance = AttendanceNode.builder()
                        .attendanceId("ATD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .status(ss.getStatus())
                        .method("MANUAL")
                        .checkedInAt(LocalDateTime.now())
                        .note(ss.getNote())
                        .student(student)
                        .session(session)
                        .build();
            }

            AttendanceNode saved = attendanceRepository.save(attendance);
            results.add(toResponse(saved));

            publisherService.publishAttendanceEvent(AttendanceEvent.builder()
                    .attendanceId(saved.getAttendanceId())
                    .sessionId(req.getSessionId())
                    .studentId(ss.getStudentId())
                    .studentName(student.getFullName())
                    .status(ss.getStatus())
                    .method("MANUAL")
                    .classId(session.getClassRoom() != null ? session.getClassRoom().getClassId() : "")
                    .className(session.getClassRoom() != null ? session.getClassRoom().getName() : "")
                    .checkedInAt(LocalDateTime.now())
                    .eventType(AttendanceEvent.EventType.MANUAL_UPDATE)
                    .build());
        }

        return results;
    }

    @Override
    public List<AttendanceResponse> getAttendanceBySession(String sessionId) {
        return attendanceRepository.findBySessionId(sessionId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AttendanceResponse updateStatus(String attendanceId, String status, String note) {
        AttendanceNode attendance = attendanceRepository.findByAttendanceId(attendanceId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy bản ghi điểm danh"));
        attendance.setStatus(status);
        attendance.setNote(note);
        attendance.setMethod("MANUAL");
        attendance.setUpdatedAt(LocalDateTime.now());
        return toResponse(attendanceRepository.save(attendance));
    }

    @Override
    @Transactional
    public AttendanceResponse updateStatusWithAudit(String attendanceId, String status,
                                                    String note, String updatedByUserId) {
        AttendanceNode attendance = attendanceRepository.findByAttendanceId(attendanceId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy bản ghi điểm danh"));
        attendance.setStatus(status);
        attendance.setNote(note);
        attendance.setMethod("MANUAL");
        attendance.setUpdatedBy(updatedByUserId);
        attendance.setUpdatedAt(LocalDateTime.now());

        AttendanceNode saved = attendanceRepository.save(attendance);

        if (saved.getStudent() != null) {
            publisherService.publishAttendanceEvent(AttendanceEvent.builder()
                    .attendanceId(attendanceId)
                    .studentId(saved.getStudent().getUserId())
                    .studentName(saved.getStudent().getFullName())
                    .status(status)
                    .method("MANUAL")
                    .eventType(AttendanceEvent.EventType.MANUAL_UPDATE)
                    .build());
        }

        return toResponse(saved);
    }

    @Override
    public List<AttendanceResponse> getStudentHistory(String studentId) {
        return attendanceRepository.findByStudentId(studentId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private String extractClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip != null && !ip.isBlank()) return ip.split(",")[0].trim();
            ip = request.getHeader("X-Real-IP");
            if (ip != null && !ip.isBlank()) return ip;
            return request.getRemoteAddr();
        } catch (Exception e) { return null; }
    }

    private String extractUserAgent() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            return attrs.getRequest().getHeader("User-Agent");
        } catch (Exception e) { return null; }
    }

    private AttendanceResponse toResponse(AttendanceNode a) {
        AttendanceResponse.StudentInfo studentInfo = null;
        if (a.getStudent() != null) {
            studentInfo = AttendanceResponse.StudentInfo.builder()
                    .userId(a.getStudent().getUserId())
                    .studentId(a.getStudent().getStudentId())
                    .fullName(a.getStudent().getFullName())
                    .email(a.getStudent().getEmail())
                    .build();
        }
        AttendanceResponse.SessionInfo sessionInfo = null;
        if (a.getSession() != null) {
            sessionInfo = AttendanceResponse.SessionInfo.builder()
                    .sessionId(a.getSession().getSessionId())
                    .sessionNumber(a.getSession().getSessionNumber())
                    .startTime(a.getSession().getStartTime())
                    .className(a.getSession().getClassRoom() != null
                            ? a.getSession().getClassRoom().getName() : null)
                    .build();
        }
        return AttendanceResponse.builder()
                .id(a.getId())
                .attendanceId(a.getAttendanceId())
                .status(a.getStatus())
                .method(a.getMethod())
                .checkedInAt(a.getCheckedInAt())
                .note(a.getNote())
                .ipAddress(a.getIpAddress())
                .deviceInfo(a.getDeviceInfo())
                .updatedBy(a.getUpdatedBy())
                .updatedAt(a.getUpdatedAt())
                .student(studentInfo)
                .session(sessionInfo)
                .build();
    }
}
