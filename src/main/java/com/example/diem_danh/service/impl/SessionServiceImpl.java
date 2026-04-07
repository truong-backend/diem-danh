package com.example.diem_danh.service.impl;


import com.example.diem_danh.dto.request.CreateSessionRequest;
import com.example.diem_danh.dto.response.SessionResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.ClassRoomNode;
import com.example.diem_danh.model.node.SessionNode;
import com.example.diem_danh.repository.ClassRoomRepository;
import com.example.diem_danh.repository.SessionRepository;
import com.example.diem_danh.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final ClassRoomRepository classRoomRepository;

    @Override
    @Transactional
    public SessionResponse createSession(String classId, CreateSessionRequest req) {
        ClassRoomNode cr = classRoomRepository.findByClassId(classId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy lớp: " + classId));

        SessionNode session = SessionNode.builder()
                .sessionId("SES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .sessionNumber(req.getSessionNumber())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .room(req.getRoom())
                .status("SCHEDULED")
                .classRoom(cr)
                .build();

        return toResponse(sessionRepository.save(session));
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
        return toResponse(sessionRepository.save(session));
    }

    @Override
    public List<SessionResponse> getSessionsByClass(String classId) {
        return sessionRepository.findByClassId(classId)
                .stream().map(this::toResponse).collect(Collectors.toList());
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