package com.example.diem_danh.controller;

import com.example.diem_danh.dto.response.*;
import com.example.diem_danh.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDashboard()));
    }

    @GetMapping("/classrooms/{id}/rate")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Object>> classRate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getClassAttendanceRate(id)));
    }

    @GetMapping("/students/{studentId}/summary")
    public ResponseEntity<ApiResponse<Object>> studentSummary(
            @PathVariable String studentId,
            @RequestParam String classId) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getStudentSummary(studentId, classId)));
    }

    @GetMapping("/sessions/{id}/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public void exportSession(@PathVariable String id, HttpServletResponse response) {
        reportService.exportSessionExcel(id, response);
    }

    @GetMapping("/classrooms/{id}/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public void exportClass(@PathVariable String id, HttpServletResponse response) {
        reportService.exportClassExcel(id, response);
    }
}
