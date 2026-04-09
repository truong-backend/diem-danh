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
    @com.fasterxml.jackson.annotation.JsonProperty("isEdited")
    private boolean isEdited;

    @com.fasterxml.jackson.annotation.JsonProperty("isDeleted")
    private boolean isDeleted;

    @com.fasterxml.jackson.annotation.JsonProperty("isPinned")
    private boolean isPinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}