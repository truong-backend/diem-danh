package com.example.diem_danh.dto.event;

import lombok.*;
import java.io.Serializable;
import java.util.List;

/**
 * Event được publish lên RabbitMQ khi cần gửi notification.
 * Consumer sẽ lưu DB + push WebSocket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {

    private String eventId;

    /** Danh sách người nhận (hỗ trợ broadcast) */
    private List<String> recipientIds;

    private String type;          // ATTENDANCE_SUBMITTED | SESSION_STARTED | GENERAL
    private String title;
    private String message;
    private String referenceId;   // sessionId hoặc attendanceId liên quan

    /** Mức độ ưu tiên: HIGH sẽ được xử lý trước */
    private Priority priority;

    public enum Priority { HIGH, NORMAL, LOW }
}
