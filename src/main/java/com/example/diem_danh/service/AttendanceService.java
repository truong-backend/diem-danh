package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.ManualAttendanceRequest;
import com.example.diem_danh.dto.request.QrAttendanceRequest;
import com.example.diem_danh.dto.response.AttendanceResponse;

import java.util.List;

public interface AttendanceService {
    AttendanceResponse checkInByQr(QrAttendanceRequest req, String studentUserId);
    List<AttendanceResponse> checkInManual(ManualAttendanceRequest req);
    List<AttendanceResponse> getAttendanceBySession(String sessionId);
    AttendanceResponse updateStatus(String attendanceId, String status, String note);
    List<AttendanceResponse> getStudentHistory(String studentId);
}