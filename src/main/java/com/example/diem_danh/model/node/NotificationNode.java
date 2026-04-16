package com.example.diem_danh.model.node;

import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;

@Node("Notification")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationNode {

    @Id @GeneratedValue
    private Long id;

    @Property("notificationId")
    private String notificationId;

    /** userId người nhận */
    @Property("recipientId")
    private String recipientId;

    /** ATTENDANCE_REMINDER | SESSION_CREATED | SESSION_UPDATED | SESSION_DELETED | GENERAL */
    @Property("type")
    private String type;

    @Property("title")
    private String title;

    @Property("message")
    private String message;

    /** ID liên quan (sessionId, classId...) */
    @Property("referenceId")
    private String referenceId;

    @Property("isRead")
    private boolean read;

    @Property("createdAt")
    private LocalDateTime createdAt;
}