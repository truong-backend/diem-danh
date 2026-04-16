package com.example.diem_danh.dto.event;

import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Event được publish lên RabbitMQ khi có sự kiện điểm danh.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceEvent implements Serializable {

    private String eventId;
    private String attendanceId;
    private String sessionId;
    private String studentId;
    private String studentName;
    private String status;      // PRESENT | LATE | ABSENT
    private String method;      // QR_CODE | MANUAL
    private String classId;
    private String className;
    private LocalDateTime checkedInAt;
    private String ipAddress;

    /** Loại event để consumer phân biệt xử lý */
    private EventType eventType;

    public enum EventType {
        CHECK_IN,          // Sinh viên vừa điểm danh
        MANUAL_UPDATE,     // Giảng viên cập nhật thủ công
        LATE_ALERT         // Sinh viên điểm danh trễ
    }
}
