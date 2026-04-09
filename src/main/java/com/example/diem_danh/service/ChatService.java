package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.CreateGroupRequest;
import com.example.diem_danh.dto.request.SendMessageRequest;
import com.example.diem_danh.dto.response.ConversationResponse;
import com.example.diem_danh.dto.response.MessageResponse;
import com.example.diem_danh.dto.response.UserResponse;

import java.util.List;

public interface ChatService {

    // ── Conversation ──────────────────────────────────────────────────────────
    ConversationResponse getOrCreatePrivateConversation(String currentUserId, String targetUserId);

    /** Tạo GROUP — chỉ TEACHER/ADMIN */
    ConversationResponse createGroup(String currentUserId, String currentUserRole, CreateGroupRequest req);

    /**
     * Tạo CLASS conversation tự động khi tạo lớp học.
     * Gọi nội bộ từ ClassRoomService.
     */
    ConversationResponse createClassConversation(String classId, String className,
                                                  String teacherUserId, List<String> studentUserIds);

    /**
     * Thêm 1 sinh viên vào CLASS conversation của lớp khi enroll.
     * Gọi nội bộ từ ClassRoomService.
     */
    void addMemberToClassConversation(String classId, String studentUserId);

    void deleteGroup(String currentUserId, String conversationId);
    void leaveGroup(String currentUserId, String conversationId);
    void addMember(String currentUserId, String conversationId, String targetUserId);
    void addMembers(String currentUserId, String conversationId, List<String> targetUserIds);
    void removeMember(String currentUserId, String conversationId, String targetUserId);
    void promoteAdmin(String currentUserId, String conversationId, String targetUserId);
    void demoteAdmin(String currentUserId, String conversationId, String targetUserId);
    void renameGroup(String currentUserId, String conversationId, String newName);

    List<ConversationResponse> getMyConversations(String userId, String userRole);
    ConversationResponse getConversation(String conversationId);

    // ── Members info ──────────────────────────────────────────────────────────
    List<UserResponse> getConversationMembers(String conversationId);
    List<UserResponse> searchUsersForChat(String keyword);

    // ── Messages ──────────────────────────────────────────────────────────────
    MessageResponse sendMessage(String senderId, SendMessageRequest req);
    MessageResponse editMessage(String callerId, String messageId, String newContent);
    MessageResponse deleteMessage(String callerId, String messageId);

    /** Ghim — chỉ TEACHER hoặc ADMIN (system role) */
    MessageResponse pinMessage(String callerId, String callerRole, String messageId);

    /** Bỏ ghim — chỉ TEACHER hoặc ADMIN (system role) */
    MessageResponse unpinMessage(String callerId, String callerRole, String messageId);

    List<MessageResponse> getMessages(String conversationId, int page, int size);
    List<MessageResponse> searchMessages(String conversationId, String keyword);
    List<MessageResponse> getPinnedMessages(String conversationId);

    // Backward-compat alias
    default ConversationResponse getOrCreateDirectConversation(String currentUserId, String targetUserId) {
        return getOrCreatePrivateConversation(currentUserId, targetUserId);
    }
}
