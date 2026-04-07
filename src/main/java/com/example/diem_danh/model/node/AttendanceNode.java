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

    @Relationship(type = "ATTENDED_BY", direction = Relationship.Direction.OUTGOING)
    private UserNode student;

    @Relationship(type = "FOR_SESSION", direction = Relationship.Direction.OUTGOING)
    private SessionNode session;
}