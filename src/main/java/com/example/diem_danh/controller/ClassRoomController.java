package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateClassRoomRequest;
import com.example.diem_danh.dto.response.*;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.security.UserPrincipal;
import com.example.diem_danh.service.ClassRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassRoomController {

    private final ClassRoomService classRoomService;
    private final UserRepository userRepository;

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

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody CreateClassRoomRequest req) {
        return ResponseEntity.ok(ApiResponse.success(classRoomService.updateClassRoom(id, req)));
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
    public ResponseEntity<ApiResponse<Void>> enroll(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        classRoomService.enrollStudent(id, body.get("studentId"));
        return ResponseEntity.ok(ApiResponse.success("Đã thêm sinh viên vào lớp", null));
    }

    /**
     * Thêm hàng loạt sinh viên vào lớp theo danh sách MSSV.
     * Body: { "studentIds": ["SV001", "SV002", ...] }
     * Response: { "success": [...], "notFound": [...] }
     */
    @PostMapping("/{id}/enroll/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> enrollBulk(
            @PathVariable String id,
            @RequestBody Map<String, List<String>> body) {

        List<String> mssvList = body.getOrDefault("studentIds", List.of());
        List<String> success = new ArrayList<>();
        List<String> notFound = new ArrayList<>();

        for (String mssv : mssvList) {
            String trimmed = mssv.trim();
            if (trimmed.isEmpty()) continue;

            UserNode user = userRepository.findByStudentId(trimmed).orElse(null);
            if (user == null) {
                notFound.add(trimmed);
                continue;
            }

            try {
                classRoomService.enrollStudent(id, user.getUserId());
                success.add(trimmed);
            } catch (Exception e) {
                // Sinh viên đã trong lớp hoặc lỗi khác — vẫn tính là success
                success.add(trimmed);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("notFound", notFound);

        return ResponseEntity.ok(ApiResponse.success("Hoàn tất thêm hàng loạt", result));
    }

    @DeleteMapping("/{id}/enroll/{uid}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> unenroll(
            @PathVariable String id, @PathVariable String uid) {
        classRoomService.unenrollStudent(id, uid);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá sinh viên khỏi lớp", null));
    }
}