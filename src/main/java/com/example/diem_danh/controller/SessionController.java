package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateSessionRequest;
import com.example.diem_danh.dto.response.*;
import com.example.diem_danh.security.UserPrincipal;
import com.example.diem_danh.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final QrService qrService;

    @GetMapping("/api/classrooms/{classId}/sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> list(@PathVariable String classId) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.getSessionsByClass(classId)));
    }

    @PostMapping("/api/classrooms/{classId}/sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<SessionResponse>> create(
            @PathVariable String classId,
            @Valid @RequestBody CreateSessionRequest req) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.createSession(classId, req)));
    }

    @GetMapping("/api/sessions/{id}")
    public ResponseEntity<ApiResponse<SessionResponse>> getOne(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.getSession(id)));
    }

    @PutMapping("/api/sessions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<SessionResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody CreateSessionRequest req) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.updateSession(id, req)));
    }

    @DeleteMapping("/api/sessions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        sessionService.deleteSession(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa buổi học", null));
    }

    @PostMapping("/api/sessions/{id}/qr")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<QrResponse>> generateQr(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(qrService.generateQr(id, principal.getUserId())));
    }

    @GetMapping("/api/sessions/{id}/qr")
    public ResponseEntity<ApiResponse<QrResponse>> getQr(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(qrService.getActiveQr(id)));
    }
}