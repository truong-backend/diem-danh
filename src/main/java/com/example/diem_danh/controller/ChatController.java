package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateGroupRequest;
import com.example.diem_danh.dto.request.SendMessageRequest;
import com.example.diem_danh.dto.response.ApiResponse;
import com.example.diem_danh.dto.response.ConversationResponse;
import com.example.diem_danh.dto.response.MessageResponse;
import com.example.diem_danh.dto.response.UserResponse;
import com.example.diem_danh.security.UserPrincipal;
import com.example.diem_danh.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.diem_danh.service.MinioService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatWebSocketController wsController;
    private final MinioService minioService;

    // ── Conversations ──────────────────────────────────────────────────────────

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> myConversations(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMyConversations(principal.getUserId(), principal.getRole())));
    }

    @PostMapping("/conversations/direct/{targetUserId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> openDirect(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String targetUserId) {
        ConversationResponse conv =
                chatService.getOrCreatePrivateConversation(principal.getUserId(), targetUserId);
        wsController.notifyNewConversation(targetUserId, conv);
        wsController.notifyNewConversation(principal.getUserId(), conv);
        return ResponseEntity.ok(ApiResponse.success(conv));
    }

    /** Tạo nhóm — chỉ TEACHER và ADMIN hệ thống */
    @PostMapping("/conversations/group")
    public ResponseEntity<ApiResponse<ConversationResponse>> createGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateGroupRequest req) {
        ConversationResponse conv = chatService.createGroup(
                principal.getUserId(), principal.getRole(), req);
        conv.getMemberIds().forEach(uid -> wsController.notifyNewConversation(uid, conv));
        return ResponseEntity.ok(ApiResponse.success(conv));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(
            @PathVariable String conversationId) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getConversation(conversationId)));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId) {
        List<UserResponse> members = chatService.getConversationMembers(conversationId);
        chatService.deleteGroup(principal.getUserId(), conversationId);
        members.forEach(m -> wsController.notifyGroupUpdate(conversationId, "GROUP_DELETED", m.getUserId()));
        return ResponseEntity.ok(ApiResponse.success("Đã xoá nhóm", null));
    }

    @PostMapping("/conversations/{conversationId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId) {
        chatService.leaveGroup(principal.getUserId(), conversationId);
        wsController.notifyGroupUpdate(conversationId, "MEMBER_REMOVED", principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã rời nhóm", null));
    }

    @PatchMapping("/conversations/{conversationId}/name")
    public ResponseEntity<ApiResponse<Void>> renameGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @RequestBody Map<String, String> body) {
        chatService.renameGroup(principal.getUserId(), conversationId, body.get("name"));
        wsController.notifyGroupUpdate(conversationId, "GROUP_RENAMED", principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã đổi tên nhóm", null));
    }

    // ── Member management ──────────────────────────────────────────────────────

    @GetMapping("/conversations/{conversationId}/members")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getMembers(
            @PathVariable String conversationId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getConversationMembers(conversationId)));
    }

    @PostMapping("/conversations/{conversationId}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @PathVariable String targetUserId) {
        chatService.addMember(principal.getUserId(), conversationId, targetUserId);
        wsController.notifyGroupUpdate(conversationId, "MEMBER_ADDED", targetUserId);
        ConversationResponse conv = chatService.getConversation(conversationId);
        wsController.notifyNewConversation(targetUserId, conv);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm thành viên", null));
    }

    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<ApiResponse<Void>> addMembers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @RequestBody Map<String, List<String>> body) {
        List<String> ids = body.get("userIds");
        if (ids == null || ids.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.success("Danh sách user rỗng", null));
        chatService.addMembers(principal.getUserId(), conversationId, ids);
        ConversationResponse conv = chatService.getConversation(conversationId);
        ids.forEach(uid -> {
            wsController.notifyGroupUpdate(conversationId, "MEMBER_ADDED", uid);
            wsController.notifyNewConversation(uid, conv);
        });
        return ResponseEntity.ok(ApiResponse.success("Đã thêm thành viên", null));
    }

    @DeleteMapping("/conversations/{conversationId}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @PathVariable String targetUserId) {
        chatService.removeMember(principal.getUserId(), conversationId, targetUserId);
        wsController.notifyGroupUpdate(conversationId, "MEMBER_REMOVED", targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá thành viên", null));
    }

    @PostMapping("/conversations/{conversationId}/members/{targetUserId}/promote")
    public ResponseEntity<ApiResponse<Void>> promoteAdmin(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @PathVariable String targetUserId) {
        chatService.promoteAdmin(principal.getUserId(), conversationId, targetUserId);
        wsController.notifyGroupUpdate(conversationId, "ADMIN_PROMOTED", targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã nâng quyền admin", null));
    }

    @PostMapping("/conversations/{conversationId}/members/{targetUserId}/demote")
    public ResponseEntity<ApiResponse<Void>> demoteAdmin(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @PathVariable String targetUserId) {
        chatService.demoteAdmin(principal.getUserId(), conversationId, targetUserId);
        wsController.notifyGroupUpdate(conversationId, "ADMIN_DEMOTED", targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã hạ quyền admin", null));
    }

    // ── Users for chat picker ──────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.searchUsersForChat(keyword)));
    }

    // ── Messages ───────────────────────────────────────────────────────────────

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMessages(conversationId, page, size)));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody SendMessageRequest req) {
        MessageResponse result = chatService.sendMessage(principal.getUserId(), req);
        wsController.broadcastMessageUpdate(result.getConversationId(), "MESSAGE_SENT", result);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId,
            @RequestBody Map<String, String> body) {
        MessageResponse result = chatService.editMessage(
                principal.getUserId(), messageId, body.get("content"));
        wsController.broadcastMessageUpdate(result.getConversationId(), "MESSAGE_EDITED", result);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> deleteMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId) {
        MessageResponse result = chatService.deleteMessage(principal.getUserId(), messageId);
        wsController.broadcastMessageUpdate(result.getConversationId(), "MESSAGE_DELETED", result);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Ghim tin nhắn — chỉ TEACHER hoặc ADMIN (system role).
     * POST /api/chat/messages/{id}/pin
     */
    @PostMapping("/messages/{messageId}/pin")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId) {
        MessageResponse result = chatService.pinMessage(
                principal.getUserId(), principal.getRole(), messageId);
        wsController.broadcastMessageUpdate(result.getConversationId(), "MESSAGE_PINNED", result);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Bỏ ghim — chỉ TEACHER hoặc ADMIN (system role).
     * POST /api/chat/messages/{id}/unpin  (hoặc DELETE /pin nếu muốn RESTful hơn)
     */
    @PostMapping("/messages/{messageId}/unpin")
    public ResponseEntity<ApiResponse<MessageResponse>> unpinMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String messageId) {
        MessageResponse result = chatService.unpinMessage(
                principal.getUserId(), principal.getRole(), messageId);
        wsController.broadcastMessageUpdate(result.getConversationId(), "MESSAGE_UNPINNED", result);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** GET /api/chat/conversations/{id}/pinned-messages */
    @GetMapping("/conversations/{conversationId}/pinned-messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> pinnedMessages(
            @PathVariable String conversationId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getPinnedMessages(conversationId)));
    }

    @GetMapping("/conversations/{conversationId}/messages/search")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> searchMessages(
            @PathVariable String conversationId,
            @RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.searchMessages(conversationId, keyword)));
    }

    // Alias cũ
    @GetMapping("/conversations/{conversationId}/messages/pinned")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> pinnedMessagesAlias(
            @PathVariable String conversationId) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getPinnedMessages(conversationId)));
    }

    // ── File upload ────────────────────────────────────────────────────────────

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file) throws Exception {
        String fileUrl = minioService.uploadFile("chat", file);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "fileUrl", fileUrl,
                "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
        )));
    }
}