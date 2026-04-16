package com.example.diem_danh.model.node;

import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;

@Node("Attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceNode {

    @Id @GeneratedValue
    private Long id;

    @Property("attendanceId")
    private String attendanceId;

    @Property("status")
    private String status; // PRESENT, ABSENT, LATE, EXCUSED

    @Property("method")
    private String method; // QR_CODE, MANUAL

    @Property("checkedInAt")
    private LocalDateTime checkedInAt;

    @Property("note")
    private String note;

    /** IP address của client khi điểm danh QR */
    @Property("ipAddress")
    private String ipAddress;

    /** Thông tin thiết bị (User-Agent hoặc deviceInfo từ client) */
    @Property("deviceInfo")
    private String deviceInfo;

    /** userId của người chỉnh sửa trạng thái gần nhất */
    @Property("updatedBy")
    private String updatedBy;

    /** Thời gian chỉnh sửa gần nhất */
    @Property("updatedAt")
    private LocalDateTime updatedAt;

    @Relationship(type = "ATTENDED_BY", direction = Relationship.Direction.OUTGOING)
    private UserNode student;

    @Relationship(type = "FOR_SESSION", direction = Relationship.Direction.OUTGOING)
    private SessionNode session;
}