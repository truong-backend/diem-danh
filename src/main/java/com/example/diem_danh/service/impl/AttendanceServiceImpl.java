package com.example.diem_danh.service.impl;


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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AttendanceResponse checkInByQr(QrAttendanceRequest req, String studentUserId) {
        if (!jwtService.isQrTokenValid(req.getQrToken())) {
            throw new QrExpiredException();
        }

        String sessionId = jwtService.extractSubject(req.getQrToken());
        SessionNode session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AttendanceException.notFound("Buổi học không tồn tại"));

        if (session.getQrToken() == null || !session.getQrToken().equals(req.getQrToken())) {
            throw new QrExpiredException();
        }

        UserNode student = userRepository.findByUserId(studentUserId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy sinh viên"));

        attendanceRepository.findBySessionAndStudent(sessionId, studentUserId).ifPresent(a -> {
            throw AttendanceException.conflict("Sinh viên đã điểm danh buổi này rồi");
        });

        LocalDateTime now = LocalDateTime.now();
        String status = now.isAfter(session.getStartTime().plusMinutes(15)) ? "LATE" : "PRESENT";

        AttendanceNode attendance = AttendanceNode.builder()
                .attendanceId("ATD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .status(status)
                .method("QR_CODE")
                .checkedInAt(now)
                .student(student)
                .session(session)
                .build();

        return toResponse(attendanceRepository.save(attendance));
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

            results.add(toResponse(attendanceRepository.save(attendance)));
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
        return toResponse(attendanceRepository.save(attendance));
    }

    @Override
    public List<AttendanceResponse> getStudentHistory(String studentId) {
        return attendanceRepository.findByStudentId(studentId)
                .stream().map(this::toResponse).collect(Collectors.toList());
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
                .student(studentInfo)
                .session(sessionInfo)
                .build();
    }
}