package com.example.diem_danh.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class MessageResponse {
    private String messageId;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private String type;
    private String fileUrl;
    private String fileName;
    private boolean isEdited;
    private boolean isDeleted;
    private boolean isPinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}