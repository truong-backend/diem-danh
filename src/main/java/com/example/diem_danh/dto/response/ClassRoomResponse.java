package com.example.diem_danh.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder
public class ClassRoomResponse {
    private Long id;
    private String classId;
    private String name;
    private String semester;
    private String academicYear;
    private Integer maxStudents;
    private String schedule;
    private CourseInfo course;
    private TeacherInfo teacher;
    private Integer studentCount;

    @Data @Builder
    public static class CourseInfo {
        private String courseId;
        private String name;
        private String code;
        private Integer credits;
    }

    @Data @Builder
    public static class TeacherInfo {
        private String userId;
        private String fullName;
        private String email;
    }
}