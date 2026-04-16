package com.example.diem_danh.service;

import com.example.diem_danh.dto.response.NotificationResponse;
import java.util.List;

public interface NotificationService {
    void send(String recipientId, String type, String title, String message, String referenceId);
    void sendToMany(List<String> recipientIds, String type, String title, String message, String referenceId);
    List<NotificationResponse> getMyNotifications(String userId, int page, int size);
    long countUnread(String userId);
    void markAllRead(String userId);
}