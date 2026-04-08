package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.CreateGroupRequest;
import com.example.diem_danh.dto.request.SendMessageRequest;
import com.example.diem_danh.dto.response.ConversationResponse;
import com.example.diem_danh.dto.response.MessageResponse;

import java.util.List;

public interface ChatService {
    // Conversation
    ConversationResponse getOrCreateDirectConversation(String currentUserId, String targetUserId);
    ConversationResponse createGroup(String currentUserId, CreateGroupRequest req);
    void deleteGroup(String currentUserId, String conversationId);
    void leaveGroup(String currentUserId, String conversationId);
    void addMember(String currentUserId, String conversationId, String targetUserId);
    void removeMember(String currentUserId, String conversationId, String targetUserId);
    List<ConversationResponse> getMyConversations(String userId);
    ConversationResponse getConversation(String conversationId);

    // Messages
    MessageResponse sendMessage(String senderId, SendMessageRequest req);
    MessageResponse editMessage(String senderId, String messageId, String newContent);
    MessageResponse deleteMessage(String senderId, String messageId);
    MessageResponse pinMessage(String senderId, String messageId);
    MessageResponse unpinMessage(String senderId, String messageId);
    List<MessageResponse> getMessages(String conversationId, int page, int size);
    List<MessageResponse> searchMessages(String conversationId, String keyword);
    List<MessageResponse> getPinnedMessages(String conversationId);
}