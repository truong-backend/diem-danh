package com.example.diem_danh.controller;

import com.example.diem_danh.dto.ChatMessage;
import com.example.diem_danh.dto.request.SendMessageRequest;
import com.example.diem_danh.dto.response.MessageResponse;
import com.example.diem_danh.security.JwtService;
import com.example.diem_danh.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final JwtService jwtService;

    /**
     * Client gửi tới: /app/chat.send
     * Server broadcast tới: /topic/conversation/{conversationId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage payload) {
        SendMessageRequest req = new SendMessageRequest();
        req.setConversationId(payload.getConversationId());
        req.setContent(payload.getContent());
        req.setType(payload.getMessageType() != null ? payload.getMessageType() : "TEXT");
        req.setFileUrl(payload.getFileUrl());
        req.setFileName(payload.getFileName());

        MessageResponse saved = chatService.sendMessage(payload.getSenderId(), req);
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + payload.getConversationId(), saved);
    }

    /**
     * Typing indicator: /app/chat.typing
     * Broadcast tới: /topic/typing/{conversationId}
     */
    @MessageMapping("/chat.typing")
    public void typing(@Payload ChatMessage payload) {
        messagingTemplate.convertAndSend(
                "/topic/typing/" + payload.getConversationId(), payload);
    }
}