package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateClassRoomRequest;
import com.example.diem_danh.dto.response.*;
import com.example.diem_danh.security.UserPrincipal;
import com.example.diem_danh.service.ClassRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassRoomController {

    private final ClassRoomService classRoomService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassRoomResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                classRoomService.getAllClassRooms(principal.getRole(), principal.getUserId())));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> create(
            @Valid @RequestBody CreateClassRoomRequest req) {
        return ResponseEntity.ok(ApiResponse.success(classRoomService.createClassRoom(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> getOne(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(classRoomService.getClassRoom(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        classRoomService.deleteClassRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá lớp học", null));
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getStudents(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(classRoomService.getStudents(id)));
    }

    @PostMapping("/{id}/enroll")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> enroll(@PathVariable String id,
                                                    @RequestBody Map<String, String> body) {
        classRoomService.enrollStudent(id, body.get("studentId"));
        return ResponseEntity.ok(ApiResponse.success("Đã thêm sinh viên vào lớp", null));
    }

    @DeleteMapping("/{id}/enroll/{uid}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> unenroll(@PathVariable String id,
                                                      @PathVariable String uid) {
        classRoomService.unenrollStudent(id, uid);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá sinh viên khỏi lớp", null));
    }
}
