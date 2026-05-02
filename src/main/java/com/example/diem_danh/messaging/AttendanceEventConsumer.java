package com.example.diem_danh.messaging;

import com.example.diem_danh.dto.event.AttendanceEvent;
import com.example.diem_danh.dto.event.NotificationEvent;
import com.example.diem_danh.service.MessagePublisherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Consumer xử lý AttendanceEvent từ attendance.queue (FIFO Queue).
 * Sau khi nhận event điểm danh → tự động publish NotificationEvent.
 * Chạy trên thread pool của RabbitMQ listener container.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AttendanceEventConsumer {

    private final MessagePublisherService publisherService;

    @RabbitListener(queues = "${app.rabbitmq.queue.attendance}",
            containerFactory = "rabbitListenerContainerFactory")
    public void handleAttendanceEvent(AttendanceEvent event) {
        log.info("[ATTENDANCE-CONSUMER] Received event: id={}, type={}, student={}, status={}",
                event.getEventId(), event.getEventType(),
                event.getStudentId(), event.getStatus());

        try {
            switch (event.getEventType()) {
                case CHECK_IN        -> handleCheckIn(event);
                case MANUAL_UPDATE   -> handleManualUpdate(event);
                case LATE_ALERT      -> handleLateAlert(event);
                default              -> log.warn("Unknown event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("[ATTENDANCE-CONSUMER] Error processing event id={}: {}",
                    event.getEventId(), e.getMessage(), e);
            throw e; // re-throw để RabbitMQ đưa vào DLQ
        }
    }

    private void handleCheckIn(AttendanceEvent event) {
        publisherService.publishNotificationEvent(NotificationEvent.builder()
                .recipientIds(List.of("teacher:" + event.getClassId()))
                .type("ATTENDANCE_SUBMITTED")
                .title("Sinh viên đã điểm danh")
                .message(String.format("%s đã điểm danh buổi học (%s)",
                        event.getStudentName(), event.getStatus()))
                .referenceId(event.getSessionId())
                .priority(NotificationEvent.Priority.NORMAL)
                .build());

        publisherService.publishSingleNotification(
                event.getStudentId(),
                "ATTENDANCE_CONFIRMED",
                "Điểm danh thành công",
                String.format("Bạn đã điểm danh buổi học lúc %s – Trạng thái: %s",
                        event.getCheckedInAt(), event.getStatus()),
                event.getSessionId()
        );
    }

    private void handleManualUpdate(AttendanceEvent event) {
        publisherService.publishSingleNotification(
                event.getStudentId(),
                "ATTENDANCE_UPDATED",
                "Điểm danh được cập nhật",
                String.format("Giảng viên đã cập nhật điểm danh của bạn: %s", event.getStatus()),
                event.getAttendanceId()
        );
    }

    private void handleLateAlert(AttendanceEvent event) {
        publisherService.publishNotificationEvent(NotificationEvent.builder()
                .recipientIds(List.of("teacher:" + event.getClassId()))
                .type("ATTENDANCE_LATE")
                .title("Sinh viên điểm danh trễ")
                .message(String.format("%s điểm danh trễ cho buổi học lớp %s",
                        event.getStudentName(), event.getClassName()))
                .referenceId(event.getSessionId())
                .priority(NotificationEvent.Priority.HIGH)
                .build());
    }
}