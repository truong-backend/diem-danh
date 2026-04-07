package com.example.diem_danh.dto.response;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder
public class DashboardResponse {
    private Long totalStudents;
    private Long totalTeachers;
    private Long totalClasses;
    private Long totalSessions;
    private Double overallAttendanceRate;
    private List<ClassAttendanceStat> classStats;
    private List<Map<String, Object>> weeklyTrend;

    @Data @Builder
    public static class ClassAttendanceStat {
        private String classId;
        private String className;
        private Double attendanceRate;
        private Integer totalSessions;
        private Integer totalStudents;
    }
}