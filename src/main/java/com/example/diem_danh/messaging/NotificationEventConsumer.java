package com.example.diem_danh.messaging;

import com.example.diem_danh.dto.event.NotificationEvent;
import com.example.diem_danh.dto.response.NotificationResponse;
import com.example.diem_danh.model.node.NotificationNode;
import com.example.diem_danh.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Consumer xử lý NotificationEvent từ notification.queue (FIFO Queue).
 * Thực hiện 2 việc:
 *  1. Lưu notification vào Neo4j (HEAP — object được GC khi hết reference)
 *  2. Push realtime tới client qua WebSocket (STOMP)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = "${app.rabbitmq.queue.notification}",
            containerFactory = "rabbitListenerContainerFactory")
    @Transactional
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("[NOTIFICATION-CONSUMER] Received event: id={}, type={}, recipients={}",
                event.getEventId(), event.getType(), event.getRecipientIds());

        if (event.getRecipientIds() == null || event.getRecipientIds().isEmpty()) {
            log.warn("[NOTIFICATION-CONSUMER] Event {} has no recipients, skipping.", event.getEventId());
            return;
        }

        for (String recipientId : event.getRecipientIds()) {
            try {
                processForRecipient(recipientId, event);
            } catch (Exception e) {
                log.error("[NOTIFICATION-CONSUMER] Error for recipient={}: {}",
                        recipientId, e.getMessage(), e);
                throw e;
            }
        }
    }

    private void processForRecipient(String recipientId, NotificationEvent event) {
        // 1. Lưu vào Neo4j
        NotificationNode node = NotificationNode.builder()
                .notificationId(UUID.randomUUID().toString())
                .recipientId(recipientId)
                .type(event.getType())
                .title(event.getTitle())
                .message(event.getMessage())
                .referenceId(event.getReferenceId())
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        NotificationNode saved = notificationRepository.save(node);

        // 2. Push qua WebSocket STOMP
        pushWebSocket(recipientId, saved);
    }

    private void pushWebSocket(String recipientId, NotificationNode node) {
        try {
            NotificationResponse response = NotificationResponse.builder()
                    .notificationId(node.getNotificationId())
                    .type(node.getType())
                    .title(node.getTitle())
                    .message(node.getMessage())
                    .referenceId(node.getReferenceId())
                    .read(node.isRead())
                    .createdAt(node.getCreatedAt())
                    .build();

            messagingTemplate.convertAndSendToUser(
                    recipientId, "/queue/notifications", response);

            log.debug("[NOTIFICATION-CONSUMER] WebSocket pushed to user={}", recipientId);
        } catch (Exception e) {
            log.warn("[NOTIFICATION-CONSUMER] WebSocket push failed for user={}: {}",
                    recipientId, e.getMessage());
        }
    }
}