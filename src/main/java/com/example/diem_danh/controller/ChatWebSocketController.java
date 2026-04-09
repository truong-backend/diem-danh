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

import java.util.Map;

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

    /**
     * Broadcast cập nhật tin nhắn (edit/delete/pin/unpin) tới tất cả thành viên.
     * Client lắng nghe: /topic/conversation/{conversationId}
     * Payload có thêm field "eventType" để client phân biệt loại event.
     */
    public void broadcastMessageUpdate(String conversationId, String eventType, MessageResponse msg) {
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId,
                Map.of("eventType", eventType, "message", msg));
    }

    /**
     * Thông báo cập nhật nhóm (thêm/xóa thành viên, đổi tên, phân quyền...).
     * Client lắng nghe: /topic/group/{conversationId}/update
     * Payload: { "type": "MEMBER_ADDED"|"MEMBER_REMOVED"|"ADMIN_PROMOTED"|"ADMIN_DEMOTED"|"GROUP_DELETED"|"GROUP_RENAMED", "userId": "..." }
     */
    public void notifyGroupUpdate(String conversationId, String eventType, String userId) {
        messagingTemplate.convertAndSend(
                "/topic/group/" + conversationId + "/update",
                Map.of("type", eventType, "userId", userId, "conversationId", conversationId));
    }

    /**
     * Thông báo cuộc trò chuyện mới được tạo / người dùng được thêm vào.
     * Client lắng nghe: /user/{userId}/queue/conversations
     */
    public void notifyNewConversation(String userId, Object conversationResponse) {
        messagingTemplate.convertAndSendToUser(
                userId, "/queue/conversations", conversationResponse);
    }

    /**
     * Thông báo user mới gia nhập hệ thống.
     * Client lắng nghe: /user/{userId}/queue/users
     */
    public void notifyUserJoined(String recipientUserId, Object newUserResponse) {
        messagingTemplate.convertAndSendToUser(
                recipientUserId, "/queue/users",
                Map.of("type", "USER_JOINED", "user", newUserResponse));
    }
}