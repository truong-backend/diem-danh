package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.event.NotificationEvent;
import com.example.diem_danh.dto.response.NotificationResponse;
import com.example.diem_danh.model.node.NotificationNode;
import com.example.diem_danh.repository.NotificationRepository;
import com.example.diem_danh.service.MessagePublisherService;
import com.example.diem_danh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * NotificationService có hai chế độ:
 *
 * 1. send() / sendToMany() → vẫn giữ đường trực tiếp (sync) cho các nơi cần
 *    đảm bảo notification được lưu trong cùng transaction (vd: khi tạo session).
 *
 * 2. publishAsync() → gửi qua RabbitMQ; Consumer sẽ lưu DB + push WebSocket.
 *    Dùng cho các luồng có thể xử lý bất đồng bộ (vd: broadcast thông báo lớp).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessagePublisherService publisherService;  // NEW

    // ── Sync (direct) ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void send(String recipientId, String type, String title,
                     String message, String referenceId) {
        NotificationNode n = NotificationNode.builder()
                .notificationId(UUID.randomUUID().toString())
                .recipientId(recipientId)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        NotificationNode saved = notificationRepository.save(n);

        // Push realtime qua WebSocket
        try {
            messagingTemplate.convertAndSendToUser(
                    recipientId, "/queue/notifications", toResponse(saved));
        } catch (Exception ignored) {
            log.warn("WebSocket push failed for user={}", recipientId);
        }
    }

    @Override
    public void sendToMany(List<String> recipientIds, String type, String title,
                           String message, String referenceId) {
        recipientIds.forEach(id -> send(id, type, title, message, referenceId));
    }

    // ── Async (via RabbitMQ) ──────────────────────────────────────────────────

    /**
     * Gửi notification bất đồng bộ qua RabbitMQ.
     * Dùng khi không cần lưu DB ngay lập tức (vd: broadcast, alert hàng loạt).
     */
    public void publishAsync(List<String> recipientIds, String type, String title,
                             String message, String referenceId,
                             NotificationEvent.Priority priority) {
        publisherService.publishNotificationEvent(NotificationEvent.builder()
                .recipientIds(recipientIds)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .priority(priority != null ? priority : NotificationEvent.Priority.NORMAL)
                .build());
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Override
    public List<NotificationResponse> getMyNotifications(String userId, int page, int size) {
        int skip = page * size;
        return notificationRepository.findByRecipientId(userId, skip, size)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public long countUnread(String userId) {
        return notificationRepository.countUnread(userId);
    }

    @Override
    @Transactional
    public void markAllRead(String userId) {
        notificationRepository.markAllRead(userId);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private NotificationResponse toResponse(NotificationNode n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
