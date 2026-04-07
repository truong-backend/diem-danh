package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.CreateSessionRequest;
import com.example.diem_danh.dto.response.SessionResponse;
import java.util.List;

public interface SessionService {
    SessionResponse createSession(String classId, CreateSessionRequest req);
    SessionResponse getSession(String sessionId);
    SessionResponse updateSession(String sessionId, CreateSessionRequest req);
    List<SessionResponse> getSessionsByClass(String classId);
}