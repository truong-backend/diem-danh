package com.example.diem_danh.service;

import com.example.diem_danh.dto.response.DashboardResponse;
import jakarta.servlet.http.HttpServletResponse;

public interface ReportService {
    DashboardResponse getDashboard();
    Object getClassAttendanceRate(String classId);
    Object getStudentSummary(String studentId, String classId);
    void exportSessionExcel(String sessionId, HttpServletResponse response);
    void exportClassExcel(String classId, HttpServletResponse response);
}