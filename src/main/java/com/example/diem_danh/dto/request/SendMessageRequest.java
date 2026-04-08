package com.example.diem_danh.dto.request;

import lombok.Data;

@Data
public class SendMessageRequest {
    private String conversationId;
    private String content;
    private String type; // TEXT | FILE
    private String fileUrl;
    private String fileName;
}