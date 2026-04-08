package com.example.diem_danh.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChatMessage {
    private String type; // SEND | EDIT | DELETE | PIN | TYPING
    private String conversationId;
    private String messageId;
    private String senderId;
    private String senderName;
    private String content;
    private String fileUrl;
    private String fileName;
    private String messageType; // TEXT | FILE
}