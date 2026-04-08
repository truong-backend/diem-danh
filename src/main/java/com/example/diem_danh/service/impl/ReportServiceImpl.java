package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.response.DashboardResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.AttendanceNode;
import com.example.diem_danh.repository.*;
import com.example.diem_danh.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final UserRepository userRepository;
    private final ClassRoomRepository classRoomRepository;
    private final SessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;

    @Override
    public DashboardResponse getDashboard() {
        Long totalStudents = userRepository.countByRole("STUDENT");
        Long totalTeachers = userRepository.countByRole("TEACHER");
        Long totalClasses = classRoomRepository.countAll();
        Long totalSessions = sessionRepository.countAll();

        List<DashboardResponse.ClassAttendanceStat> classStats = classRoomRepository
                .findAllWithDetails().stream().map(cr -> {
                    try {
                        Long sessionCount = sessionRepository.countByClassId(cr.getClassId());
                        Long studentCount = classRoomRepository.countStudentsInClass(cr.getClassId());
                        List<Map<String, Object>> summary = attendanceRepository
                                .getSessionAttendanceSummary(cr.getClassId());

                        double rate = 0.0;
                        if (sessionCount != null && sessionCount > 0
                                && studentCount != null && studentCount > 0
                                && !summary.isEmpty()) {
                            long totalPresent = summary.stream()
                                    .mapToLong(m -> ((Number) m.getOrDefault("presentCount", 0)).longValue())
                                    .sum();
                            rate = (double) totalPresent / (sessionCount * studentCount) * 100;
                        }

                        return DashboardResponse.ClassAttendanceStat.builder()
                                .classId(cr.getClassId())
                                .className(cr.getName())
                                .attendanceRate(Math.round(rate * 10.0) / 10.0)
                                .totalSessions(sessionCount != null ? sessionCount.intValue() : 0)
                                .totalStudents(studentCount != null ? studentCount.intValue() : 0)
                                .build();
                    } catch (Exception e) {
                        return DashboardResponse.ClassAttendanceStat.builder()
                                .classId(cr.getClassId())
                                .className(cr.getName())
                                .attendanceRate(0.0)
                                .totalSessions(0)
                                .totalStudents(0)
                                .build();
                    }
                }).collect(Collectors.toList());

        double overallRate = classStats.isEmpty() ? 0.0 :
                classStats.stream().mapToDouble(DashboardResponse.ClassAttendanceStat::getAttendanceRate)
                        .average().orElse(0.0);

        return DashboardResponse.builder()
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalClasses(totalClasses)
                .totalSessions(totalSessions)
                .overallAttendanceRate(Math.round(overallRate * 10.0) / 10.0)
                .classStats(classStats)
                .weeklyTrend(List.of()) // extend as needed
                .build();
    }

    @Override
    public Object getClassAttendanceRate(String classId) {
        List<Map<String, Object>> summary = attendanceRepository.getSessionAttendanceSummary(classId);
        Long studentCount = classRoomRepository.countStudentsInClass(classId);
        return Map.of("classId", classId, "sessions", summary, "totalStudents", studentCount);
    }

    @Override
    public Object getStudentSummary(String studentId, String classId) {
        List<Map<String, Object>> summary = attendanceRepository
                .getStudentAttendanceSummaryByClass(studentId, classId);
        return Map.of("studentId", studentId, "classId", classId, "summary", summary);
    }

    @Override
    public void exportSessionExcel(String sessionId, HttpServletResponse response) {
        List<AttendanceNode> list = attendanceRepository.findBySessionId(sessionId);
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=attendance_" + sessionId + ".xlsx");

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Attendance");
            Row header = sheet.createRow(0);
            String[] cols = {"STT", "MSSV", "Họ tên", "Email", "Trạng thái", "Phương thức", "Giờ điểm danh", "Ghi chú"};
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }

            int rowNum = 1;
            for (AttendanceNode a : list) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(rowNum - 1);
                row.createCell(1).setCellValue(a.getStudent() != null ? a.getStudent().getStudentId() : "");
                row.createCell(2).setCellValue(a.getStudent() != null ? a.getStudent().getFullName() : "");
                row.createCell(3).setCellValue(a.getStudent() != null ? a.getStudent().getEmail() : "");
                row.createCell(4).setCellValue(a.getStatus());
                row.createCell(5).setCellValue(a.getMethod());
                row.createCell(6).setCellValue(a.getCheckedInAt() != null ? a.getCheckedInAt().toString() : "");
                row.createCell(7).setCellValue(a.getNote() != null ? a.getNote() : "");
            }

            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi xuất Excel: " + e.getMessage());
        }
    }

    @Override
    public void exportClassExcel(String classId, HttpServletResponse response) {
        // Similar to session export — iterate all sessions
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=class_" + classId + ".xlsx");
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Class Report");
            Row header = sheet.createRow(0);
            String[] cols = {"Buổi", "Phòng", "Thời gian", "Tổng hiện diện"};
            for (int i = 0; i < cols.length; i++) header.createCell(i).setCellValue(cols[i]);

            List<Map<String, Object>> sessions = attendanceRepository.getSessionAttendanceSummary(classId);
            int row = 1;
            for (Map<String, Object> s : sessions) {
                Row r = sheet.createRow(row++);
                r.createCell(0).setCellValue(String.valueOf(s.get("sessionNumber")));
                r.createCell(1).setCellValue("");
                r.createCell(2).setCellValue(String.valueOf(s.get("startTime")));
                r.createCell(3).setCellValue(String.valueOf(s.get("presentCount")));
            }

            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi xuất Excel: " + e.getMessage());
        }
    }
}