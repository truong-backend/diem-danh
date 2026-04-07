package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateCourseRequest;
import com.example.diem_danh.dto.response.ApiResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.CourseNode;
import com.example.diem_danh.repository.CourseRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseRepository courseRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseNode>>> list() {
        return ResponseEntity.ok(ApiResponse.success(courseRepository.findAllOrdered()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseNode>> create(@Valid @RequestBody CreateCourseRequest req) {
        if (courseRepository.existsByCode(req.getCode())) {
            throw AttendanceException.conflict("Mã môn học đã tồn tại");
        }
        CourseNode course = CourseNode.builder()
                .courseId("CRS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name(req.getName())
                .code(req.getCode())
                .credits(req.getCredits())
                .description(req.getDescription())
                .build();
        return ResponseEntity.ok(ApiResponse.success(courseRepository.save(course)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseNode>> getOne(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                courseRepository.findByCourseId(id)
                        .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy môn học"))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseNode>> update(@PathVariable String id,
                                                          @Valid @RequestBody CreateCourseRequest req) {
        CourseNode course = courseRepository.findByCourseId(id)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy môn học"));
        course.setName(req.getName());
        course.setCredits(req.getCredits());
        course.setDescription(req.getDescription());
        return ResponseEntity.ok(ApiResponse.success(courseRepository.save(course)));
    }
}