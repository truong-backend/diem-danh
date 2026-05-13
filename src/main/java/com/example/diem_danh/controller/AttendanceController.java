package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.*;
import com.example.diem_danh.dto.response.*;
import com.example.diem_danh.security.UserPrincipal;
import com.example.diem_danh.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
//
    private final AttendanceService attendanceService;

    @PostMapping("/qr")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkInByQr(
            @Valid @RequestBody QrAttendanceRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Điểm danh thành công",
                attendanceService.checkInByQr(req, principal.getUserId())));
    }

    @PostMapping("/manual")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> checkInManual(
            @Valid @RequestBody ManualAttendanceRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
                "Điểm danh thủ công thành công",
                attendanceService.checkInManual(req)));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> bySession(
            @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.success(
                attendanceService.getAttendanceBySession(sessionId)));
    }

    /** Cập nhật trạng thái kèm audit log (lưu người sửa) */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                attendanceService.updateStatusWithAudit(
                        id,
                        body.get("status"),
                        body.get("note"),
                        principal.getUserId())));
    }

    @GetMapping("/students/{studentId}")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> studentHistory(
            @PathVariable String studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                attendanceService.getStudentHistory(studentId)));
    }
}