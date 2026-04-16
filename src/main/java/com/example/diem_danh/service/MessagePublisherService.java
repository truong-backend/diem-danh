package com.example.diem_danh.service;

import com.example.diem_danh.dto.event.AttendanceEvent;
import com.example.diem_danh.dto.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service publish các event lên RabbitMQ.
 * Tách riêng khỏi business logic để dễ mock trong test.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessagePublisherService {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange.notification}")
    private String notificationExchange;

    @Value("${app.rabbitmq.exchange.attendance}")
    private String attendanceExchange;

    @Value("${app.rabbitmq.routing.notification}")
    private String notificationRoutingKey;

    @Value("${app.rabbitmq.routing.attendance}")
    private String attendanceRoutingKey;

    // ── Attendance events ─────────────────────────────────────────────────────

    /**
     * Publish event điểm danh (QR hoặc manual) lên attendance queue.
     */
    public void publishAttendanceEvent(AttendanceEvent event) {
        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID().toString());
        }
        try {
            rabbitTemplate.convertAndSend(attendanceExchange, attendanceRoutingKey, event);
            log.debug("Attendance event published: id={}, type={}, student={}",
                    event.getEventId(), event.getEventType(), event.getStudentId());
        } catch (Exception e) {
            log.error("Failed to publish attendance event: {}", e.getMessage(), e);
            // Không throw để không làm gián đoạn luồng điểm danh chính
        }
    }

    // ── Notification events ───────────────────────────────────────────────────

    /**
     * Publish notification event lên notification queue.
     * Consumer sẽ lưu Neo4j + push WebSocket.
     */
    public void publishNotificationEvent(NotificationEvent event) {
        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID().toString());
        }
        try {
            rabbitTemplate.convertAndSend(notificationExchange, notificationRoutingKey, event);
            log.debug("Notification event published: id={}, recipients={}",
                    event.getEventId(), event.getRecipientIds());
        } catch (Exception e) {
            log.error("Failed to publish notification event: {}", e.getMessage(), e);
        }
    }

    /**
     * Tiện ích: publish notification đơn giản cho một người nhận.
     */
    public void publishSingleNotification(String recipientId, String type,
                                          String title, String message, String referenceId) {
        publishNotificationEvent(NotificationEvent.builder()
                .recipientIds(java.util.List.of(recipientId))
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .priority(NotificationEvent.Priority.NORMAL)
                .build());
    }
}
