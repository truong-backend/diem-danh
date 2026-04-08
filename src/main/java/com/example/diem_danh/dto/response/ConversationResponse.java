package com.example.diem_danh.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class ConversationResponse {
    private String conversationId;
    private String name;
    private boolean isGroup;
    private String avatarUrl;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<String> memberIds;
    private List<String> adminIds;
    private List<String> pinnedMessageIds;
    private MessageResponse lastMessage;
}